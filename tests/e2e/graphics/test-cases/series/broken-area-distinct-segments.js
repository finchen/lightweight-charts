function generateSeriesData() {
	return [
		{ time: '2023-01-01', low: 5, high: 10, color: 'blue' }, // First segment (blue)
		{ time: '2023-01-02', low: 20, high: 22, color: 'red' },  // Second segment (red), contiguous in time but different color and Y
		{ time: '2023-01-03', low: 7, high: 12, color: 'red' },
		{ time: '2023-01-04', low: 5, high: 10, color: 'red' },
	];
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		width: 400,
		height: 300,
	});

	const mainSeries = chart.addBrokenAreaSeries({
		// Explicitly set extendRight to false for clarity, though it's the default.
		extendRight: false,
		// Set a stroke to make the polygon edges clear for visual verification.
		strokeWidth: 1,
		strokeColor: 'black', // Or rely on default stroke behavior if preferred
	});

	mainSeries.setData(generateSeriesData());

	// Log for manual verification
	console.log(
		'Test case "broken-area-distinct-segments": Chart rendered. ' +
		'Please visually verify that the blue segment (ending 2023-01-01, high 10) ' +
		'and the red segment (starting 2023-01-02, high 22) are distinct polygons ' +
		'with no connecting lines between their different Y values. ' +
		'They should appear as separate shapes.'
	);
}
