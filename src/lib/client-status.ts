// Phase 5: replace with live GymSettings.walkInActiveDays value
const WALK_IN_ACTIVE_DAYS = 7;

export function getClientType(hasMembership: boolean) {
  return hasMembership ? "MEMBER" : "WALK_IN";
}

export function getClientStatus(client: {
  memberships: {
    endDate: Date;
  }[];

  attendances: {
    timeIn: Date;
  }[];
}) {
  const latestMembership = client.memberships[0];

  // MEMBER
  if (latestMembership) {
    return latestMembership.endDate > new Date() ? "ACTIVE" : "EXPIRED";
  }

  // WALK-IN
  const latestAttendance = client.attendances[0];

  if (!latestAttendance) {
    return "INACTIVE";
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WALK_IN_ACTIVE_DAYS);

  return latestAttendance.timeIn >= cutoff ? "ACTIVE" : "INACTIVE";
}
