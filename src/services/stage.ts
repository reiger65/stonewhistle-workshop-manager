export const STAGE_ORDER = [
    "Ordered","Validated","Building","Testing","TerraSigillata","Firing",
    "SmokeFiring","Tuning1","Tuning2","QualityCheck","Ready","Shipping","Delivered"
  ] as const;
  
  export type Stage = typeof STAGE_ORDER[number];
  
  export function nextStage(current: Stage): Stage | null {
    const i = STAGE_ORDER.indexOf(current);
    if (i < 0 || i === STAGE_ORDER.length - 1) return null;
    return STAGE_ORDER[i + 1];
  }
  
  export const NON_WORK_STAGES: Stage[] = ["Delivered"];
  export const WORK_STAGES: Stage[] = STAGE_ORDER.filter(s => !NON_WORK_STAGES.includes(s)) as Stage[];