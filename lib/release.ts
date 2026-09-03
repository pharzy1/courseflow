export const COURSEFLOW_SOURCE_TAG=process.env.COURSEFLOW_SOURCE_TAG??"development";
export const COURSEFLOW_RELEASE=COURSEFLOW_SOURCE_TAG.startsWith("v")?COURSEFLOW_SOURCE_TAG.slice(1):COURSEFLOW_SOURCE_TAG;
export const COURSEFLOW_SOURCE_URL=COURSEFLOW_SOURCE_TAG.startsWith("v")?`https://github.com/pharzy1/courseflow/releases/tag/${COURSEFLOW_SOURCE_TAG}`:`https://github.com/pharzy1/courseflow/commit/${COURSEFLOW_SOURCE_TAG}`;

export const releaseEvidence={version:COURSEFLOW_RELEASE,tag:COURSEFLOW_SOURCE_TAG,sourceUrl:COURSEFLOW_SOURCE_URL};
