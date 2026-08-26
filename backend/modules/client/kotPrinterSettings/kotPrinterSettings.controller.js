const {
    findSettingsByLocation,
    findSettingsById,
    getStationsBySettingsId,
    createSettings,
    updateSettings,
    createStation,
    findStationById,
    updateStation,
    deleteStation,
} = require("./kotPrinterSettings.model");

const buildSettingsPayload = (body) => ({
    business_location_id: body.business_location_id,
    system_ip: body.system_ip,
    billing_printer_ip: body.billing_printer_ip,
    billing_printer_port: Number(body.billing_printer_port) || 9100,
    default_kot_ip: body.default_kot_ip,
    default_kot_port: Number(body.default_kot_port) || 9100,
    has_extra_kot: body.has_extra_kot === "yes" ? "yes" : "no",
});

const getSettings = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { business_location_id } = req.query;

        if (!business_location_id) {
            return res.status(400).json({
                success: false,
                message: "business_location_id is required",
            });
        }

        const settings = await findSettingsByLocation(clientId, business_location_id);

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "No KOT printer settings found for this location",
            });
        }

        const stations = await getStationsBySettingsId(settings.id);

        return res.status(200).json({
            success: true,
            data: { settings, stations },
        });

    } catch (error) {
        console.error("Get KOT printer settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const addSettings = async (req, res) => {
    try {
        const clientId = req.user.id;
        const errors = {};

        if (!req.body.business_location_id) errors.business_location_id = "Location is required";
        if (!req.body.system_ip) errors.system_ip = "System IP is required";
        if (!req.body.billing_printer_ip) errors.billing_printer_ip = "Billing printer IP is required";
        if (!req.body.default_kot_ip) errors.default_kot_ip = "Default KOT IP is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const existing = await findSettingsByLocation(clientId, req.body.business_location_id);

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "KOT printer settings already exist for this location",
            });
        }

        const payload = buildSettingsPayload(req.body);

        const settings = await createSettings(clientId, payload);

        const stations = [];

        if (payload.has_extra_kot === "yes" && Array.isArray(req.body.stations)) {
            for (const station of req.body.stations) {
                if (!station.category_id || !station.printer_ip) continue;

                const created = await createStation(settings.id, {
                    category_id: station.category_id,
                    printer_ip: station.printer_ip,
                    printer_port: Number(station.printer_port) || 9100,
                });

                stations.push(created);
            }
        }

        return res.status(201).json({
            success: true,
            message: "KOT printer settings created successfully",
            data: { settings, stations },
        });

    } catch (error) {
        console.error("Create KOT printer settings error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "KOT printer settings already exist for this location",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const editSettings = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const existing = await findSettingsById(id, clientId);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "KOT printer settings not found",
            });
        }

        const payload = buildSettingsPayload(req.body);

        const settings = await updateSettings(id, clientId, payload);

        return res.status(200).json({
            success: true,
            message: "KOT printer settings updated successfully",
            data: settings,
        });

    } catch (error) {
        console.error("Update KOT printer settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const addStation = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { business_location_id, category_id, printer_ip, printer_port } = req.body;

        if (!business_location_id || !category_id || !printer_ip) {
            return res.status(400).json({
                success: false,
                message: "business_location_id, category_id and printer_ip are required",
            });
        }

        const settings = await findSettingsByLocation(clientId, business_location_id);

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "KOT printer settings not found for this location",
            });
        }

        const station = await createStation(settings.id, {
            category_id,
            printer_ip,
            printer_port: Number(printer_port) || 9100,
        });

        return res.status(201).json({
            success: true,
            message: "KOT station created successfully",
            data: station,
        });

    } catch (error) {
        console.error("Create KOT station error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A station for this category already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const editStation = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;
        const { printer_ip, printer_port } = req.body;

        if (!printer_ip) {
            return res.status(400).json({
                success: false,
                message: "printer_ip is required",
            });
        }

        const existing = await findStationById(id, clientId);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "KOT station not found",
            });
        }

        const station = await updateStation(id, {
            printer_ip,
            printer_port: Number(printer_port) || 9100,
        });

        return res.status(200).json({
            success: true,
            message: "KOT station updated successfully",
            data: station,
        });

    } catch (error) {
        console.error("Update KOT station error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const removeStation = async (req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const existing = await findStationById(id, clientId);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "KOT station not found",
            });
        }

        await deleteStation(id);

        return res.status(200).json({
            success: true,
            message: "KOT station deleted successfully",
        });

    } catch (error) {
        console.error("Delete KOT station error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


module.exports = {
    getSettings,
    addSettings,
    editSettings,
    addStation,
    editStation,
    removeStation,
};