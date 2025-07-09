import { useState } from 'react';
import { Button } from '@/components/button/Button';
import { Modal } from '@/components/modal/Modal';
import { Input } from '@/components/input/Input';
import { Label } from '@/components/label/Label';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Plus, UserCircle, Trash } from '@phosphor-icons/react';

interface UserSelectorProps {
  className?: string;
}

export const UserSelector = ({ className }: UserSelectorProps) => {
  const { users, currentUserId, createUser, selectUser, deleteUser } = useUserManagement();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [error, setError] = useState('');

  const handleCreateUser = () => {
    try {
      setError('');
      createUser(newUserName);
      setNewUserName('');
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleDeleteUser = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (users.length <= 1) {
      setError('Cannot delete the last user');
      return;
    }
    
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        deleteUser(userId);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <UserCircle size={16} className="text-neutral-600 dark:text-neutral-400" />
        <select
          value={currentUserId}
          onChange={(e) => {
            if (e.target.value !== currentUserId) {
              selectUser(e.target.value);
              // Reload the page to switch to the new user's chat agent
              window.location.reload();
            }
          }}
          className="text-sm border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 bg-background min-w-32"
        >
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-7 w-7 p-0"
          aria-label="Create new user"
        >
          <Plus size={14} />
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewUserName('');
          setError('');
        }}
        className="max-w-md"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Create New User</h3>
          <div>
            <Label htmlFor="username" title="User Name" />
            <Input
              id="username"
              type="text"
              initialValue={newUserName}
              onValueChange={(value) => setNewUserName(value)}
              placeholder="Enter user name"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateUser();
                }
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Existing users: {users.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewUserName('');
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateUser}
                disabled={!newUserName.trim()}
              >
                Create User
              </Button>
            </div>
          </div>

          {users.length > 1 && (
            <div className="border-t pt-4">
              <Label title="Manage Users" />
              <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                    <span className="text-sm truncate">{user.name}</span>
                    {users.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteUser(user.id, e)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash size={12} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
