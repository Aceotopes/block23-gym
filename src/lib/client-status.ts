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

  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return latestAttendance.timeIn >= sevenDaysAgo ? "ACTIVE" : "INACTIVE";
}
