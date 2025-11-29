"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { BoxCard } from '@/components/BoxCard';
import { CreateBoxForm } from '@/components/CreateBoxForm';
import { ChatInterface } from '@/components/ChatInterface';

export const Dashboard: React.FC = () => {
  const { boxes } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Left Sidebar / Main Area for Boxes */}
      <div className="w-1/2 lg:w-1/3 p-4 overflow-y-auto border-r border-gray-200 dark:border-gray-800 flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold mb-1">Content Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your content contexts</p>
        </header>
        
        <CreateBoxForm />
        
        <div className="flex flex-col gap-4">
          {boxes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Create a box to get started!</p>
          ) : (
            boxes.map((box) => (
              <BoxCard key={box.id} box={box} />
            ))
          )}
        </div>
      </div>

      {/* Right Area for Chat */}
      <div className="flex-1 p-4 h-full">
        <ChatInterface />
      </div>
    </div>
  );
};

