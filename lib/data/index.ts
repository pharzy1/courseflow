import { NeonCourseRepository } from "./neon";
import { SnapshotCourseRepository } from "./snapshot";
import type { CourseDataRepository } from "./types";

export function getCourseRepository(mode=process.env.COURSEFLOW_DATA_MODE):CourseDataRepository{
  return mode==="neon"?new NeonCourseRepository():new SnapshotCourseRepository();
}
export * from "./types";
