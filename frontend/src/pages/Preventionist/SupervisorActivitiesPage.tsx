import { useParams, Link } from 'react-router-dom';
import ActivityCalendarView from '@/components/ActivityCalendar/ActivityCalendarView';
import { Button } from '@/components/ui/button';

const SupervisorActivitiesPage = () => {
  const { supervisorId } = useParams<{ supervisorId: string }>();

  if (!supervisorId) {
    return <div>Error: Supervisor ID not found.</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to="/dashboard/preventionist">Volver al Panel</Link>
        </Button>
      </div>
      <ActivityCalendarView userId={parseInt(supervisorId, 10)} />
    </div>
  );
};

export default SupervisorActivitiesPage;
