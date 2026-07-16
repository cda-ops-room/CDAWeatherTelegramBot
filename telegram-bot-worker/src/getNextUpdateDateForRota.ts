import { rule } from './bot/rule';
import getRotaNumberForDate from './getRotaNumberForDate';
import { Rota } from './db/rota';

export function getNextUpdateDateForRota(rota: Rota, fromDate: Date = new Date()): Date | null {
	let cursor = fromDate;

	for (let attempt = 0; attempt < 200; attempt++) {
		const nextInvocation = rule.nextInvocationDate(cursor);

		if (!nextInvocation) {
			return null;
		}

		const nextDate = nextInvocation;

		if (rota === 0 || getRotaNumberForDate(nextDate) === rota) {
			return nextDate;
		}

		cursor = new Date(nextDate.getTime() + 60_000);
	}

	return null;
}
