// src/lib/utils/dateUtils.js
//@ts-nocheck
export function getWeekDateRange(weekNumber, year = new Date().getFullYear()) {
	// Get the first day of the year
	const firstDayOfYear = new Date(year, 0, 1);
	// Calculate the start date of the week
	const startDate = new Date(firstDayOfYear);
	startDate.setDate(firstDayOfYear.getDate() + (weekNumber - 1) * 7);
	// Calculate the end date of the week
	const endDate = new Date(startDate);
	endDate.setDate(startDate.getDate() + 6);

	// Format the dates
	const formatDate = (date) => {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
