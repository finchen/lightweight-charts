function generateCustomData() {
	return [
		// Segment 1: extends right, should connect to the start of segment 2
		{ time: '2023-01-01', low: 5, high: 10, color: 'blue', extendRight: true },
		// Segment 2: starts immediately after segment 1, different color
		{ time: '2023-01-02', low: 6, high: 11, color: 'red' },
		// Add a few more points to make the chart render reasonably
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
		// General series options if needed, e.g., stroke
		// strokeColor: 'black',
		// strokeWidth: 1,
	});

	mainSeries.setData(generateCustomData());

	// The test case is set up to render the scenario.
	// Manual visual verification and baseline image generation will be required
	// to confirm the fix for the extendRight behavior.
	console.log('Test case for BrokenArea extendRight: Chart rendered. Please verify visually.');
}
