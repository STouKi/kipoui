// A first message prepared by another screen (the Repas tab's suggestions), sent by the new
// conversation screen as soon as it opens
export interface CoachDraft {
  text: string
  files: File[]
}

let draft: CoachDraft | null = null

export function setCoachDraft(value: CoachDraft) {
  draft = value
}

export function takeCoachDraft() {
  const value = draft
  draft = null
  return value
}
