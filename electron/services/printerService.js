const net = require('net');

const DEFAULT_PORT = 9100;
const CONNECT_TIMEOUT_MS = 3500;
const RECEIPT_WIDTH = 48;

function normalizeText(value) {
    return String(value ?? '')
        .replace(/₹/g, 'Rs.')
        .replace(/[^\x20-\x7E\r\n]/g, '?');
}

function fit(text, width = RECEIPT_WIDTH) {
    const value = normalizeText(text);
    if (value.length <= width) return value;
    return value.slice(0, Math.max(0, width - 1)) + '.';
}

function center(text, width = RECEIPT_WIDTH) {
    const value = fit(text, width);
    const left = Math.max(0, Math.floor((width - value.length) / 2));
    return `${' '.repeat(left)}${value}`;
}

function columns(left, right, width = RECEIPT_WIDTH) {
    const l = normalizeText(left);
    const r = normalizeText(right);
    const maxLeft = Math.max(1, width - r.length - 1);
    const safeLeft = l.length > maxLeft ? `${l.slice(0, Math.max(0, maxLeft - 1))}.` : l;
    const spaces = Math.max(1, width - safeLeft.length - r.length);
    return `${safeLeft}${' '.repeat(spaces)}${r}`;
}

function money(value) {
    return `Rs.${(Number(value) || 0).toFixed(2)}`;
}

function formatReceiptDate(value) {
    if (!value) {
        return new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }

    const raw = String(value).trim();

    // SQLite CURRENT_TIMESTAMP stores UTC without a timezone suffix.
    // Convert "2026-09-19 05:44:00" to
    // "2026-09-19T05:44:00Z" before parsing.
    const sqliteUtc = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

    const normalized = sqliteUtc.test(raw)
        ? `${raw.replace(' ', 'T')}Z`
        : raw;

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
        return normalizeText(value);
    }

    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function buildReceiptBuffer(sale) {
    const locationName = sale.business_location_name || 'Restaurant';
    const addressParts = [
        sale.business_location_address,
        sale.business_location_city,
        sale.business_location_state
    ].filter(Boolean);

    const items = Array.isArray(sale.items) ? sale.items : [];
    const payments = Array.isArray(sale.payments) ? sale.payments : [];
    const lines = [];

    const clientName = sale.client_name || '';

    // Branch/location details
    lines.push(center(locationName));

    if (addressParts.length) {
        lines.push(center(addressParts.join(', ')));
    }

    if (sale.business_location_phone) {
        lines.push(center(`Ph: ${sale.business_location_phone}`));
    }

    if (sale.business_location_gst_number) {
        lines.push(center(`GSTIN: ${sale.business_location_gst_number}`));
    }

    lines.push('-'.repeat(RECEIPT_WIDTH));

    lines.push(columns(
        'Invoice',
        sale.invoice_number || sale.sale_number || '-'
    ));

    lines.push(columns(
        'Date',
        formatReceiptDate(sale.created_at)
    ));

    lines.push(columns(
        'Type',
        String(sale.sale_type || 'dining').toUpperCase()
    ));

    lines.push(columns(
        'Customer',
        sale.customer_name || 'Walk-In Customer'
    ));

    lines.push('-'.repeat(RECEIPT_WIDTH));
    lines.push(columns('Item', 'Amount'));
    lines.push('-'.repeat(RECEIPT_WIDTH));

    for (const item of items) {
        lines.push(fit(item.product_name || 'Item'));

        const qty = Number(item.quantity) || 0;
        const unit = Number(item.unit_price_inc_tax) || 0;
        const discount = Number(item.discount_amount) || 0;

        lines.push(
            columns(
                `  ${qty} x ${money(unit)}${discount ? ` - Disc ${money(discount)}` : ''
                }`,
                money(item.line_total)
            )
        );
    }

    lines.push('-'.repeat(RECEIPT_WIDTH));

    lines.push(columns(
        'Subtotal',
        money(sale.subtotal)
    ));

    if (Number(sale.discount_amount)) {
        lines.push(
            columns(
                'Discount',
                `-${money(sale.discount_amount)}`
            )
        );
    }

    if (Number(sale.order_tax_amount)) {
        lines.push(
            columns(
                'Tax',
                money(sale.order_tax_amount)
            )
        );
    }

    if (Number(sale.round_off_amount)) {
        lines.push(
            columns(
                'Round off',
                money(sale.round_off_amount)
            )
        );
    }

    lines.push('='.repeat(RECEIPT_WIDTH));

    lines.push(
        columns(
            'TOTAL',
            money(sale.total_amount)
        )
    );

    lines.push('='.repeat(RECEIPT_WIDTH));

    if (payments.length) {
        lines.push('Payment');

        for (const payment of payments) {
            lines.push(
                columns(
                    `  ${String(
                        payment.payment_method || ''
                    ).toUpperCase()}`,
                    money(payment.amount)
                )
            );
        }

        lines.push('-'.repeat(RECEIPT_WIDTH));
    }

    lines.push(center('Thank you!'));
    lines.push('', '', '');

    // ESC/POS commands
    const initialize = Buffer.from([0x1b, 0x40]);

    // Bold ON / OFF
    const boldOn = Buffer.from([0x1b, 0x45, 0x01]);
    const boldOff = Buffer.from([0x1b, 0x45, 0x00]);

    // 2x width + 2x height
    const doubleSize = Buffer.from([0x1d, 0x21, 0x11]);

    // Return to normal text size
    const normalSize = Buffer.from([0x1d, 0x21, 0x00]);

    /*
     * Because double-size text is twice as wide,
     * a 48-character printer effectively has about
     * 24 characters for this line.
     */
    const clientText = clientName
        ? Buffer.from(
            `${center(clientName, Math.floor(RECEIPT_WIDTH / 2))}\n`,
            'ascii'
        )
        : Buffer.alloc(0);

    const receiptText = Buffer.from(
        `${lines.join('\n')}\n`,
        'ascii'
    );

    const cut = Buffer.from([0x1d, 0x56, 0x00]);

    return Buffer.concat([
        initialize,

        // CLIENT NAME
        boldOn,
        doubleSize,
        clientText,
        normalSize,
        boldOff,

        // REST OF RECEIPT
        receiptText,

        cut
    ]);
}

function buildKotBuffer(sale, categoryName, items) {
    const lines = [];
    lines.push(center('KITCHEN ORDER TICKET'));
    lines.push('='.repeat(RECEIPT_WIDTH));
    lines.push(columns('KOT', sale.invoice_number || sale.sale_number || '-'));
    lines.push(columns('Date', formatReceiptDate(sale.created_at)));
    lines.push(columns('Type', String(sale.sale_type || 'dining').toUpperCase()));
    lines.push(columns('Category', categoryName || 'KOT'));
    if (sale.customer_name) lines.push(columns('Customer', sale.customer_name));
    lines.push('-'.repeat(RECEIPT_WIDTH));

    for (const item of items) {
        const qty = Number(item.quantity) || 0;
        lines.push(`${qty} x ${fit(item.product_name || 'Item', RECEIPT_WIDTH - 6)}`);
    }

    lines.push('='.repeat(RECEIPT_WIDTH));
    lines.push('', '', '');

    const initialize = Buffer.from([0x1b, 0x40]);
    const boldOn = Buffer.from([0x1b, 0x45, 0x01]);
    const boldOff = Buffer.from([0x1b, 0x45, 0x00]);
    const text = Buffer.from(`${lines.join('\n')}\n`, 'ascii');
    const cut = Buffer.from([0x1d, 0x56, 0x00]);
    return Buffer.concat([initialize, boldOn, text, boldOff, cut]);
}

function sendRawToPrinter(ip, port, payload, timeoutMs = CONNECT_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const host = String(ip || '').trim();
        const printerPort = Number(port) || DEFAULT_PORT;
        if (!host) {
            reject(new Error('Printer IP is not configured'));
            return;
        }

        let settled = false;
        const socket = net.createConnection({ host, port: printerPort });

        const finish = (error) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            if (error) reject(error);
            else resolve({ success: true, ip: host, port: printerPort });
        };

        socket.setTimeout(timeoutMs);
        socket.once('timeout', () => finish(new Error(`Printer connection timed out (${host}:${printerPort})`)));
        socket.once('error', (error) => finish(new Error(`Printer unavailable (${host}:${printerPort}): ${error.message}`)));
        socket.once('connect', () => {
            socket.write(payload, (error) => {
                if (error) {
                    finish(new Error(`Failed to send data to printer: ${error.message}`));
                    return;
                }
                socket.end(() => finish());
            });
        });
    });
}

async function printBillingReceipt(sale, settings) {
    const ip = settings?.billing_printer_ip;
    const port = Number(settings?.billing_printer_port) || DEFAULT_PORT;

    if (!ip) {
        return {
            success: false,
            skipped: true,
            message: 'Billing Printer IP is not configured for this business location.',
        };
    }

    try {
        await sendRawToPrinter(ip, port, buildReceiptBuffer(sale));
        return {
            success: true,
            skipped: false,
            ip,
            port,
            message: `Receipt sent to ${ip}:${port}`,
        };
    } catch (error) {
        return {
            success: false,
            skipped: false,
            ip,
            port,
            message: error.message,
        };
    }
}

function samePrinter(ipA, portA, ipB, portB) {
    return String(ipA || '').trim().toLowerCase() === String(ipB || '').trim().toLowerCase()
        && (Number(portA) || DEFAULT_PORT) === (Number(portB) || DEFAULT_PORT);
}

async function printKotTickets(sale, printerConfig) {
    const settings = printerConfig?.settings;
    const stations = Array.isArray(printerConfig?.stations) ? printerConfig.stations : [];
    const items = Array.isArray(sale?.items) ? sale.items : [];

    if (!settings || !items.length || !stations.length) {
        return {
            success: true,
            skipped: true,
            results: [],
            message: 'No category KOT printers are configured.',
        };
    }

    const stationByCategory = new Map();
    for (const station of stations) {
        if (station.category_id && station.printer_ip) {
            stationByCategory.set(String(station.category_id), station);
        }
    }

    const grouped = new Map();
    for (const item of items) {
        if (!item.category_id) continue;
        const station = stationByCategory.get(String(item.category_id));
        if (!station) continue;
        const key = String(item.category_id);
        if (!grouped.has(key)) {
            grouped.set(key, {
                categoryId: item.category_id,
                categoryName: item.category_name || 'KOT',
                station,
                items: [],
            });
        }
        grouped.get(key).items.push(item);
    }

    if (!grouped.size) {
        return {
            success: true,
            skipped: true,
            results: [],
            message: 'No sale items belong to a category with a KOT printer.',
        };
    }

    const defaultIp = String(settings.default_kot_ip || '').trim();
    const defaultPort = Number(settings.default_kot_port) || DEFAULT_PORT;
    const results = [];

    for (const group of grouped.values()) {
        const primaryIp = String(group.station.printer_ip || '').trim();
        const primaryPort = Number(group.station.printer_port) || DEFAULT_PORT;
        const payload = buildKotBuffer(sale, group.categoryName, group.items);

        try {
            await sendRawToPrinter(primaryIp, primaryPort, payload);
            results.push({
                success: true,
                category_id: group.categoryId,
                category_name: group.categoryName,
                item_count: group.items.length,
                ip: primaryIp,
                port: primaryPort,
                used_default: false,
                message: `KOT sent to ${primaryIp}:${primaryPort}`,
            });
            continue;
        } catch (primaryError) {
            if (!defaultIp) {
                results.push({
                    success: false,
                    category_id: group.categoryId,
                    category_name: group.categoryName,
                    item_count: group.items.length,
                    ip: primaryIp,
                    port: primaryPort,
                    used_default: false,
                    message: primaryError.message,
                });
                continue;
            }

            if (samePrinter(primaryIp, primaryPort, defaultIp, defaultPort)) {
                results.push({
                    success: false,
                    category_id: group.categoryId,
                    category_name: group.categoryName,
                    item_count: group.items.length,
                    ip: primaryIp,
                    port: primaryPort,
                    used_default: false,
                    default_same_as_primary: true,
                    message: `${primaryError.message}. Default KOT printer is the same printer.`,
                });
                continue;
            }

            try {
                await sendRawToPrinter(defaultIp, defaultPort, payload);
                results.push({
                    success: true,
                    category_id: group.categoryId,
                    category_name: group.categoryName,
                    item_count: group.items.length,
                    ip: defaultIp,
                    port: defaultPort,
                    used_default: true,
                    primary_ip: primaryIp,
                    primary_port: primaryPort,
                    message: `Assigned KOT printer failed; KOT sent to Default KOT printer ${defaultIp}:${defaultPort}`,
                });
            } catch (fallbackError) {
                results.push({
                    success: false,
                    category_id: group.categoryId,
                    category_name: group.categoryName,
                    item_count: group.items.length,
                    ip: primaryIp,
                    port: primaryPort,
                    fallback_ip: defaultIp,
                    fallback_port: defaultPort,
                    used_default: true,
                    message: `Assigned printer failed: ${primaryError.message}; Default KOT printer failed: ${fallbackError.message}`,
                });
            }
        }
    }

    const failed = results.filter((result) => !result.success);
    return {
        success: failed.length === 0,
        skipped: false,
        results,
        message: failed.length
            ? `${failed.length} KOT print job(s) failed.`
            : `${results.length} KOT print job(s) completed.`,
    };
}

module.exports = {
    buildReceiptBuffer,
    buildKotBuffer,
    sendRawToPrinter,
    printBillingReceipt,
    printKotTickets,
};