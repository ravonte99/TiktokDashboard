import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, X } from 'lucide-react';

export const CreateBoxForm: React.FC = () => {
  const { addBox } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addBox({
      name,
      description,
    });

    setName('');
    setDescription('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        <Plus className="w-5 h-5" /> Create New Box
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">New Box</h3>
        <button type="button" onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        type="text"
        placeholder="Box Name (e.g. 'Inspiration')"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded p-2 dark:bg-gray-800"
        autoFocus
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border rounded p-2 text-sm dark:bg-gray-800"
        rows={2}
      />
      <div className="flex justify-end">
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Create
        </button>
      </div>
    </form>
  );
};

