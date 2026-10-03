import type { ApplicationFunctionOptions, Probot } from 'probot';
import { scheduleDaily } from './daily.js';
import { dailyHandler } from './daily-route.js';

export default (app: Probot, { addHandler }: ApplicationFunctionOptions) => {
  scheduleDaily(app);
  addHandler(dailyHandler(app));
};
