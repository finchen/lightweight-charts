import { undefinedIfNull } from '../../helpers/strict-type-checks';
import { BarPrice } from '../../model/bar';
import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PlotRowValueIndex } from '../../model/plot-data';
import { PriceScale } from '../../model/price-scale';
import { Series } from '../../model/series';
import { SeriesPlotRow } from '../../model/series-data';
import { visibleTimedValues } from '../../model/time-data';
import { TimeScale } from '../../model/time-scale';
import {
	PaneRendererBrokenArea,
	PaneRendererBrokenAreaData,
} from '../../renderers/broken-area-renderer';
import { BrokenCloudLineItem } from '../../renderers/cloud-area-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';

import { CloudAreaPaneViewBase } from './cloud-area-pane-view-base';

export class SeriesBrokenAreaPaneView extends CloudAreaPaneViewBase<
	'BrokenArea',
	BrokenCloudLineItem,
	CompositeRenderer
> {
	protected readonly _renderer: CompositeRenderer = new CompositeRenderer();
	private readonly _brokenAreaRenderer: PaneRendererBrokenArea =
		new PaneRendererBrokenArea();

	public constructor(series: Series<'BrokenArea'>, model: ChartModel) {
		super(series, model, false);
		this._renderer.setRenderers([this._brokenAreaRenderer]);
	}

	public setExtensionsBoundaries(extensionsBoundaries: {
		[id: string]: number;
	}): void {
		this._brokenAreaRenderer.extensionsBoundaries = extensionsBoundaries;
	}

	protected _prepareRendererData(): void {
		const areaStyleProperties = this._series.options();

		const brokenAreaRenderer: PaneRendererBrokenAreaData = {
			items: this._items,
			color: areaStyleProperties.color,
			strokeColor: areaStyleProperties.strokeColor,
			strokeWidth: areaStyleProperties.strokeWidth,
			visibleRange: this._itemsVisibleRange,
			barWidth: this._model.timeScale().barSpacing(),
		};

		this._brokenAreaRenderer.setData(brokenAreaRenderer);
	}

	protected override _convertToCoordinates(
		priceScale: PriceScale,
		timeScale: TimeScale,
		firstValue?: number
	): void {
		const { h, bh, min, max, ih, isInverted, transformFn } = priceScale.getRange();
		const { w, ro, bs } = timeScale.getRange();

		const hmm = ih / (max - min);

		const visibleRange = undefinedIfNull(this._itemsVisibleRange);
		const baseIndex = timeScale.baseIndex();
		const indexFrom = (visibleRange === undefined) ? 0 : visibleRange.from;
		const indexTo = (visibleRange === undefined) ? this._items.length : visibleRange.to;

		for (let i = indexFrom; i < indexTo; i++) {
			const point = this._items[i];

			const higherPrice = point.higherPrice;
			const lowerPrice = point.lowerPrice;

			if (isNaN(higherPrice) || isNaN(lowerPrice)) {
				continue;
			}

			let higherLogical = higherPrice;
			let lowerLogical = lowerPrice;
			if (transformFn !== null) {
				higherLogical = transformFn(point.higherPrice, firstValue as number) as BarPrice;
				lowerLogical = transformFn(point.lowerPrice, firstValue as number) as BarPrice;
			}

			let invCoordinate = bh + hmm * (higherLogical - min);
			let coordinate = isInverted ? invCoordinate : h - 1 - invCoordinate;
			point.higherY = coordinate as Coordinate;

			invCoordinate = bh + hmm * (lowerLogical - min);
			coordinate = isInverted ? invCoordinate : h - 1 - invCoordinate;
			point.lowerY = coordinate as Coordinate;

			const index = point.time;
			let deltaFromRight = baseIndex + ro - index;
			coordinate = w - (deltaFromRight + 0.5) * bs - 1;
			point.x = Math.round(coordinate) as Coordinate;

			if (typeof point.id !== 'undefined' && this._brokenAreaRenderer.extensionsBoundaries[point.id]) {
				deltaFromRight = baseIndex + ro - this._brokenAreaRenderer.extensionsBoundaries[point.id];
				coordinate = w - (deltaFromRight + 0.5) * bs - 1;
				point.end = Math.round(coordinate) as Coordinate;
			} else {
				point.end = w as Coordinate;
			}
		}
	}

	protected override _fillRawPoints(): void {
		this._items = this._series
			.bars()
			.rows()
			.map((row: SeriesPlotRow<'BrokenArea'>) => {
				const higherValue = row.value[PlotRowValueIndex.High] as BarPrice;
				const lowerValue = row.value[PlotRowValueIndex.Low] as BarPrice;

				const res: BrokenCloudLineItem = {
					time: row.index,
					higherPrice: higherValue,
					lowerPrice: lowerValue,
					x: NaN as Coordinate,
					end: NaN as Coordinate,
					higherY: NaN as Coordinate,
					lowerY: NaN as Coordinate,
				};

				if (typeof row.color !== 'undefined') {
					res.color = row.color;
				}

				if (typeof row.id !== 'undefined') {
					res.id = row.id;
				}

				if (typeof row.label !== 'undefined') {
					res.label = row.label;
				}

				if (typeof row.extendRight !== 'undefined') {
					res.extendRight = row.extendRight;
				}

				return res;
			});
	}

	protected override _makeValidImpl(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();

		this._clearVisibleRange();

		if (timeScale.isEmpty() || priceScale.isEmpty()) {
			return;
		}

		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		if (this._series.bars().size() === 0) {
			return;
		}

		const firstValue = this._series.firstValue();

		this._itemsVisibleRange = !firstValue || this._series.options().infinite ? {
			from: 0,
			to: this._items.length,
		} : visibleTimedValues(this._items, visibleBars, false);
		this._convertToCoordinates(priceScale, timeScale, firstValue?.value);

		this._prepareRendererData();
	}
}
