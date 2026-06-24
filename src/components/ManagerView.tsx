import { shifts, staffConflicts, staffMembers, teams } from "../data/mockData";
import {
  formatDateLabel,
  formatTimeRange,
  parseLocalDateTime,
} from "../lib/date";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

export function ManagerView({ currentUser }: Props) {
  if (currentUser.role !== "manager") {
    return (
      <section className="screen">
        <div className="section-header">
          <div>
            <p className="eyebrow">Manager View</p>
            <h2>Restricted</h2>
          </div>
          <span className="pill">Role-gated in UI</span>
        </div>
        <p className="lead">
          This area is only for managers. Future server-side authorization must
          enforce this as well.
        </p>
      </section>
    );
  }

  const managedTeamIds = teams
    .filter((team) => team.managerIds.includes(currentUser.id))
    .map((team) => team.id);

  const visibleConflicts = staffConflicts.filter((conflict) =>
    managedTeamIds.includes(conflict.teamId),
  );

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">Manager View</p>
          <h2>Mocked staff conflicts</h2>
        </div>
        <span className="pill">Assigned teams only</span>
      </div>

      <p className="lead">
        Managers only see staff in teams they manage. This screen stays
        intentionally narrow and does not expose broader scheduling data.
      </p>

      <div className="card-grid">
        {visibleConflicts.map((conflict) => {
          const staff = staffMembers.find(
            (member) => member.id === conflict.staffId,
          );
          const shift = shifts.find((item) => item.id === conflict.shiftId);

          return (
            <article className="card" key={conflict.id}>
              <div className="severity-row">
                <h3>{staff?.name ?? "Unknown staff member"}</h3>
                <span className={`severity severity-${conflict.severity}`}>
                  {conflict.severity}
                </span>
              </div>
              <p>{conflict.summary}</p>
              <p className="muted">
                {shift
                  ? `${formatDateLabel(parseLocalDateTime(shift.start))} • ${formatTimeRange(
                      parseLocalDateTime(shift.start),
                      parseLocalDateTime(shift.end),
                    )}`
                  : "Shift details pending"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
