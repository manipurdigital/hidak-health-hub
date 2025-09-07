import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SimpleSearchInputProps {
  placeholder: string;
  onAdd: (value: string) => void;
}

export const SimpleSearchInput = ({ placeholder, onAdd }: SimpleSearchInputProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        onKeyPress={handleKeyPress}
      />
      <Button type="submit" size="sm" disabled={!value.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
};