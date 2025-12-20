import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from '@/types/activity';
import { User as UserIcon } from 'lucide-react';
import { Link } from "react-router-dom";

interface SupervisorsModalProps {
  supervisors: User[];
  activityName: string;
  isOpen: boolean;
  onClose: () => void;
  getInitials: (name: string) => string;
  getAvatarColor: (id: number) => string;
}

const SupervisorsModal = ({
  supervisors,
  activityName,
  isOpen,
  onClose,
  getInitials,
  getAvatarColor
}: SupervisorsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Supervisores - {activityName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-4">
            Total de supervisores: <span className="font-semibold">{supervisors.length}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supervisors.map((supervisor) => (
              <Link
                to={`/preventionist/supervisor/${supervisor.id}`}
                key={supervisor.id}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-full ${getAvatarColor(supervisor.id)} flex items-center justify-center shrink-0`}>
                  <span className="text-base font-bold text-white">
                    {getInitials(supervisor.username)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-800 truncate">
                    {supervisor.username}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    {supervisor.email}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorsModal;
