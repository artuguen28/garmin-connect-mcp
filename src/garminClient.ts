import garminConnectPkg from "garmin-connect";
import { config } from "./config.js";

const { GarminConnect } = garminConnectPkg;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  const message = String(error);
  return /429|rate\s*limit|too\s*many\s*requests/i.test(message);
}

export class GarminService {
  private client = new GarminConnect({
    username: config.garminUsername,
    password: config.garminPassword,
  });

  private isAuthenticated = false;
  private callQueue: Promise<void> = Promise.resolve();
  private lastCallAt = 0;

  // Conservative defaults to avoid Garmin anti-abuse throttling.
  private minCallIntervalMs = 1500;
  private maxRetries = 3;
  private retryDelaysMs = [5000, 15000, 30000];

  private async scheduleCall<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.callQueue;
    let release!: () => void;
    this.callQueue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;

    try {
      const elapsed = Date.now() - this.lastCallAt;
      if (elapsed < this.minCallIntervalMs) {
        await sleep(this.minCallIntervalMs - elapsed);
      }

      for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
        try {
          const result = await fn();
          this.lastCallAt = Date.now();
          return result;
        } catch (error) {
          if (!isRateLimitError(error) || attempt === this.maxRetries) {
            throw error;
          }

          const retryAfter = this.retryDelaysMs[attempt] ?? this.retryDelaysMs[this.retryDelaysMs.length - 1];
          console.warn(`Garmin rate limit hit. Retrying in ${retryAfter}ms (attempt ${attempt + 1}/${this.maxRetries}).`);
          await sleep(retryAfter);
        }
      }

      throw new Error("Unexpected Garmin retry flow state");
    } finally {
      release();
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.isAuthenticated) {
      return;
    }

    await this.scheduleCall(() => this.client.login());
    this.isAuthenticated = true;
  }

  async getRecentActivities(limit: number): Promise<unknown[]> {
    await this.ensureAuthenticated();
    return this.scheduleCall(() => this.client.getActivities(0, limit));
  }

  async getActivityDetail(activityId: number): Promise<unknown> {
    await this.ensureAuthenticated();
    return this.scheduleCall(() => this.client.getActivity({ activityId }));
  }

  async getDailyMetrics(date: Date): Promise<{
    date: string;
    steps: number | null;
    heartRate: unknown;
    sleep: unknown;
  }> {
    await this.ensureAuthenticated();

    // Sequential reads reduce burst traffic and avoid triggering Garmin throttling.
    const stepsResult = await this.scheduleCall(() => this.client.getSteps(date).then((value) => ({ status: "fulfilled" as const, value })).catch(() => ({ status: "rejected" as const })));
    const heartRateResult = await this.scheduleCall(() => this.client.getHeartRate(date).then((value) => ({ status: "fulfilled" as const, value })).catch(() => ({ status: "rejected" as const })));
    const sleepResult = await this.scheduleCall(() => this.client.getSleepData(date).then((value) => ({ status: "fulfilled" as const, value })).catch(() => ({ status: "rejected" as const })));

    return {
      date: date.toISOString().slice(0, 10),
      steps: stepsResult.status === "fulfilled" ? stepsResult.value : null,
      heartRate: heartRateResult.status === "fulfilled" ? heartRateResult.value : { unavailable: true },
      sleep: sleepResult.status === "fulfilled" ? sleepResult.value : { unavailable: true },
    };
  }
}

export const garminService = new GarminService();
