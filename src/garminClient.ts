import garminConnectPkg from "garmin-connect";
import { config } from "./config.js";

const { GarminConnect } = garminConnectPkg;

export class GarminService {
  private client = new GarminConnect({
    username: config.garminUsername,
    password: config.garminPassword,
  });

  private isAuthenticated = false;

  private async ensureAuthenticated(): Promise<void> {
    if (this.isAuthenticated) {
      return;
    }

    await this.client.login();
    this.isAuthenticated = true;
  }

  async getRecentActivities(limit: number): Promise<unknown[]> {
    await this.ensureAuthenticated();
    return this.client.getActivities(0, limit);
  }

  async getActivityDetail(activityId: number): Promise<unknown> {
    await this.ensureAuthenticated();
    return this.client.getActivity({ activityId });
  }

  async getDailyMetrics(date: Date): Promise<{
    date: string;
    steps: number | null;
    heartRate: unknown;
    sleep: unknown;
  }> {
    await this.ensureAuthenticated();

    const [stepsResult, heartRateResult, sleepResult] = await Promise.allSettled([
      this.client.getSteps(date),
      this.client.getHeartRate(date),
      this.client.getSleepData(date),
    ]);

    return {
      date: date.toISOString().slice(0, 10),
      steps: stepsResult.status === "fulfilled" ? stepsResult.value : null,
      heartRate: heartRateResult.status === "fulfilled" ? heartRateResult.value : { unavailable: true },
      sleep: sleepResult.status === "fulfilled" ? sleepResult.value : { unavailable: true },
    };
  }
}

export const garminService = new GarminService();
