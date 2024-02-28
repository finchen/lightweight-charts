import { CloudPricedValue } from '../model/price-scale';
import { SeriesItemsIndexesRange, TimedValue } from '../model/time-data';
import { BrokenCloudLineItem } from './cloud-area-renderer';
import { MediaCoordinatesPaneRenderer } from './media-coordinates-pane-renderer';
import { MediaCoordinatesRenderingScope } from 'fancy-canvas';

export type CloudLineItem = TimedValue & CloudPricedValue;

export interface PaneRendererBrokenAreaData {
	items: BrokenCloudLineItem[];

	color: string;
	strokeColor: string;
	strokeWidth: number;

	barWidth: number;

	visibleRange: SeriesItemsIndexesRange | null;
}

export class PaneRendererBrokenArea extends MediaCoordinatesPaneRenderer {
	public extensionsBoundaries: { [id: string]: number } = {};
	protected _data: PaneRendererBrokenAreaData | null = null;

	public setData(data: PaneRendererBrokenAreaData): void {
		this._data = data;
	}

	// eslint-disable-next-line complexity
	protected _drawImpl(renderingScope: MediaCoordinatesRenderingScope): void {
		if (
			this._data === null ||
			this._data.items.length === 0 ||
			!this._data.visibleRange
		) {
			return;
		}

		const ctx = renderingScope.context;

		const chunks: [number, number][] = [];
		let chunkStart = this._data.visibleRange.from;
		const chunkEnd = this._data.visibleRange.to;

		if (chunkStart === chunkEnd) {
			chunks.push([chunkStart, chunkEnd]);
		} else {
			let lastTime = null;
			let lastColor = null;
			for (
				let i = chunkStart;
				i < chunkEnd;
				++i
			) {
				const currItem = this._data.items[i];

				if (lastTime !== null && (currItem.time - lastTime > 1 || currItem.color !== lastColor)) {
					chunks.push([chunkStart, currItem.time - lastTime > 1 ? i - 1 : i]);
					chunkStart = i;
				}

				lastTime = currItem.time;
				lastColor = currItem.color;
			}
			chunks.push([chunkStart, Math.max(chunkEnd ? chunkEnd - 1 : 0, chunkStart)]);
		}

		ctx.strokeStyle = this._data.strokeColor;
		ctx.lineWidth = this._data.strokeWidth;
		ctx.fillStyle = this._data.color;

		for (let i = 0; i < chunks.length; ++i) {
			const fromItemIndex = chunks[i][0];
			const toItemIndex = chunks[i][1];

			if (typeof this._data.items[fromItemIndex].label !== 'undefined') {
				ctx.fillStyle = this._data.strokeColor;
				ctx.fillText(this._data.items[fromItemIndex].label as string, this._data.items[fromItemIndex].x, this._data.items[fromItemIndex].higherY - 4);
				ctx.fillStyle = this._data.color;
			}

			ctx.beginPath();

			ctx.moveTo(
				this._data.items[fromItemIndex].x,
				this._data.items[fromItemIndex].higherY
			);

			if (this._data.items[fromItemIndex].extendRight && this._data.items[fromItemIndex].higherY === this._data.items[fromItemIndex].lowerY && fromItemIndex === toItemIndex) {
				if (typeof this._data.items[fromItemIndex].color !== 'undefined') {
					ctx.strokeStyle = this._data.items[fromItemIndex].color as string;
				}

				ctx.lineTo(
					this._data.items[fromItemIndex].end,
					this._data.items[fromItemIndex].higherY
				);
				if (this._data.strokeWidth) {
					ctx.stroke();
				}
				continue;
			}

			for (let j = fromItemIndex; j <= toItemIndex; j++) {
				ctx.lineTo(this._data.items[j].x, this._data.items[j].higherY);
			}

			if (this._data.items[fromItemIndex].extendRight) {
				ctx.lineTo(this._data.items[toItemIndex].end, this._data.items[toItemIndex].higherY);
				ctx.lineTo(this._data.items[toItemIndex].end, this._data.items[toItemIndex].lowerY);
			}

			for (let j = toItemIndex; j >= fromItemIndex; --j) {
				ctx.lineTo(this._data.items[j].x, this._data.items[j].lowerY);
			}

			ctx.closePath();

			if (typeof this._data.items[fromItemIndex].color !== 'undefined') {
				ctx.fillStyle = this._data.items[fromItemIndex].color as string;
			}

			if (this._data.color) {
				ctx.fill();
			}

			if (this._data.strokeWidth) {
				ctx.stroke();
			}
		}
	}
}
