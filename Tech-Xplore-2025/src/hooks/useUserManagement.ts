import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

const USERS_STORAGE_KEY = 'chat-users';
const CURRENT_USER_STORAGE_KEY = 'current-user-id';

// Generate a safe ID from user name
const generateUserIdFromName = (name: string): string => {
  const cleanName = name.trim().toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Fallback if name becomes empty after cleaning
  return cleanName || 'user';
};

// Default user
const DEFAULT_USER: User = {
  id: 'default-user',
  name: 'Default User',
  createdAt: new Date().toISOString(),
};

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Initialize users and current user on mount
  useEffect(() => {
    // Load users from localStorage
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let parsedUsers: User[] = [];

    if (storedUsers) {
      try {
        parsedUsers = JSON.parse(storedUsers);
      } catch (error) {
        console.error('Failed to parse stored users:', error);
      }
    }

    // If no users exist, create default user
    if (parsedUsers.length === 0) {
      parsedUsers = [DEFAULT_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsedUsers));
    }

    setUsers(parsedUsers);

    // Load current user
    const storedCurrentUserId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (storedCurrentUserId && parsedUsers.some(user => user.id === storedCurrentUserId)) {
      setCurrentUserId(storedCurrentUserId);
    } else {
      // Set default user as current if no valid current user
      setCurrentUserId(parsedUsers[0].id);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, parsedUsers[0].id);
    }
  }, []);

  // Save users to localStorage whenever users array changes
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users]);

  // Save current user ID to localStorage whenever it changes
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUserId);
    }
  }, [currentUserId]);

  const createUser = (name: string): User => {
    if (!name.trim()) {
      throw new Error('User name cannot be empty');
    }

    let userId = generateUserIdFromName(name);
    let counter = 1;

    // Handle potential ID collisions by appending a number
    while (users.some(user => user.id === userId)) {
      userId = `${generateUserIdFromName(name)}-${counter}`;
      counter++;
    }

    const newUser: User = {
      id: userId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    setUsers(prevUsers => [...prevUsers, newUser]);
    // Immediately set the new user as current
    setCurrentUserId(newUser.id);
    return newUser;
  };

  const selectUser = (userId: string): void => {
    if (users.some(user => user.id === userId) || userId === currentUserId) {
      setCurrentUserId(userId);
    } else {
      throw new Error('User not found');
    }
  };

  const deleteUser = (userId: string): void => {
    if (users.length <= 1) {
      throw new Error('Cannot delete the last user');
    }

    if (userId === currentUserId) {
      // Switch to first available user that's not being deleted
      const remainingUsers = users.filter(user => user.id !== userId);
      setCurrentUserId(remainingUsers[0].id);
    }

    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  const getCurrentUser = (): User | undefined => {
    return users.find(user => user.id === currentUserId);
  };

  return {
    users,
    currentUserId,
    currentUser: getCurrentUser(),
    createUser,
    selectUser,
    deleteUser,
  };
};
