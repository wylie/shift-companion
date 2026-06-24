import { unavailabilityRules } from "../data/mockData";
import type { CurrentUser } from "../types";

type Props = {
  currentUser: CurrentUser;
};

export function MyUnavailability({ currentUser }: Props) {
  const rules = unavailabilityRules.filter(
    (rule) => rule.userId === currentUser.id,
  );

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">My Unavailability</p>
          <h2>Recurring availability constraints</h2>
        </div>
        <span className="pill">Mocked data only</span>
      </div>

      <p className="lead">
        Staff only see their own recurring unavailability. CRUD will be added in
        a later phase.
      </p>

      <div className="card-grid">
        {rules.map((rule) => (
          <article className="card" key={rule.id}>
            <h3>{rule.title}</h3>
            <p>{rule.recurrence}</p>
            <p className="muted">{rule.notes}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
