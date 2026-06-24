import { shifts } from "../data/mockData";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

export function MySchedule({ currentUser }: Props) {
  const myShifts = shifts.filter((shift) => shift.userId === currentUser.id);

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <p className="eyebrow">My Schedule</p>
          <h2>Upcoming shifts</h2>
        </div>
        <span className="pill">Calendar export later</span>
      </div>

      <p className="lead">
        Schedule cards are mocked locally. Future personal export and
        subscription features stay individual-only.
      </p>

      <div className="card-grid">
        {myShifts.map((shift) => (
          <article className="card" key={shift.id}>
            <h3>{shift.title}</h3>
            <p>{shift.day}</p>
            <p>{shift.timeRange}</p>
            <p className="muted">{shift.location}</p>
          </article>
        ))}
      </div>

      <article className="callout">
        <h3>Future calendar export</h3>
        <p>
          Placeholder for a downloadable `.ics` file and later a private
          revocable subscription feed.
        </p>
      </article>
    </section>
  );
}
