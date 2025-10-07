import { Queue, Worker, QueueEvents, JobsOptions } from "bullmq";
import { EvalJobPayload } from "../types.ts";

const connection = { url: process.env.REDIS_URL } as any;

export const EVAL_QUEUE = new Queue<EvalJobPayload>("eval-queue", { connection });
export const EVAL_EVENTS = new QueueEvents("eval-queue", { connection });

export const addEvalJob = (data: EvalJobPayload, opts: JobsOptions = {}) =>
  EVAL_QUEUE.add("evaluate", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
    ...opts,
  });
