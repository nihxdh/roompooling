/**
 * Segment-based booking pricing: splits accommodation rent among co-tenants
 * for overlapping date ranges. When users share dates, rent is split proportionally.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculate totalPrice for a booking using segment-based split.
 * Breaks the stay into segments where occupancy is constant; for each segment,
 * splits the rent among all overlapping bookings.
 *
 * @param {Object} booking - { checkIn, checkOut, spaces, selectedAmenities }
 * @param {Array} overlappingBookings - All bookings overlapping this period (must include this booking if confirmed, or pass includeSelf)
 * @param {Object} accommodation - { price }
 * @param {Object} opts - { includeSelf: boolean } - if true, treats booking as part of overlap pool (for new/pending bookings)
 * @returns {number} totalPrice
 */
function calculateBookingPrice(booking, overlappingBookings, accommodation, opts = {}) {
    const { includeSelf = false } = opts;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const monthlyPrice = accommodation.price || 0;
    const amenitiesTotal = (booking.selectedAmenities || []).reduce((s, a) => s + (a.rate || 0), 0);

    const pool = overlappingBookings.map(b => ({
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut),
        spaces: b.spaces || 1
    }));
    if (includeSelf) {
        pool.push({
            checkIn: new Date(booking.checkIn),
            checkOut: new Date(booking.checkOut),
            spaces: booking.spaces || 1
        });
    }

    // Collect boundary timestamps for segments (start/end of each overlapping booking)
    const boundaries = new Set();
    boundaries.add(checkIn.getTime());
    boundaries.add(checkOut.getTime());
    for (const b of pool) {
        const bStart = b.checkIn.getTime();
        const bEnd = b.checkOut.getTime();
        if (bEnd > checkIn.getTime() && bStart < checkOut.getTime()) {
            if (bStart > checkIn.getTime() && bStart < checkOut.getTime()) boundaries.add(bStart);
            if (bEnd > checkIn.getTime() && bEnd < checkOut.getTime()) boundaries.add(bEnd);
        }
    }

    const sorted = [...boundaries]
        .filter(t => t >= checkIn.getTime() && t <= checkOut.getTime())
        .sort((a, b) => a - b);

    let rentTotal = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
        const segStart = sorted[i];
        const segEnd = sorted[i + 1];
        const segDays = Math.max(1, Math.ceil((segEnd - segStart) / MS_PER_DAY));

        let totalSpaces = 0;
        for (const b of pool) {
            if (b.checkOut.getTime() > segStart && b.checkIn.getTime() < segEnd) {
                totalSpaces += b.spaces;
            }
        }
        if (totalSpaces === 0) totalSpaces = booking.spaces || 1;

        const segRent = monthlyPrice * (segDays / 30);
        const thisShare = segRent * ((booking.spaces || 1) / totalSpaces);
        rentTotal += thisShare;
    }

    const totalDays = Math.max(1, Math.ceil((checkOut - checkIn) / MS_PER_DAY));
    const amenitiesForPeriod = amenitiesTotal * (totalDays / 30);
    return Math.round(rentTotal + amenitiesForPeriod);
}

module.exports = { calculateBookingPrice };
