export function getPrimaryLocationId(locations) {
    const primaryLocation = locations.find((location) =>
        location.is_primary === true ||
        location.is_primary === 1 ||
        location.is_primary === "1" ||
        String(location.is_primary).toLowerCase() === "true"
    );

    return primaryLocation ? String(primaryLocation.id) : "";
}
