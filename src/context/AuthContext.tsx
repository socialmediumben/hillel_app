'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile } from '@/lib/types';
import { useConfig } from './ConfigContext';
import { getStudentByCard, updateStudentProfile } from '@/lib/sheets';

interface AuthContextType {
  student: StudentProfile | null;
  isLoading: boolean;
  login: (student: StudentProfile) => void;
  logout: () => void;
  loginByCard: (cardId: string) => Promise<StudentProfile | null>;
  updateStudent: (partial: Partial<StudentProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_STUDENT_KEY = 'hillel_active_student';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { config } = useConfig();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(LS_STUDENT_KEY);
      if (cached) {
        setStudent(JSON.parse(cached));
      }
    } catch (_) {}
    setIsLoading(false);
  }, []);

  const login = (studentData: StudentProfile) => {
    setStudent(studentData);
    try {
      localStorage.setItem(LS_STUDENT_KEY, JSON.stringify(studentData));
    } catch (_) {}
  };

  const logout = () => {
    setStudent(null);
    try {
      localStorage.removeItem(LS_STUDENT_KEY);
    } catch (_) {}
  };

  const loginByCard = async (cardId: string): Promise<StudentProfile | null> => {
    try {
      const found = await getStudentByCard(cardId, config);
      if (found) {
        login(found);
        return found;
      }
    } catch (err) {
      console.error('Failed to login by card:', err);
    }
    return null;
  };

  const updateStudent = async (partial: Partial<StudentProfile>): Promise<boolean> => {
    if (!student) return false;
    const updated: StudentProfile = { ...student, ...partial };
    setStudent(updated);
    try {
      localStorage.setItem(LS_STUDENT_KEY, JSON.stringify(updated));
    } catch (_) {}
    const res = await updateStudentProfile(updated, config);
    return res.success;
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        isLoading,
        login,
        logout,
        loginByCard,
        updateStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
