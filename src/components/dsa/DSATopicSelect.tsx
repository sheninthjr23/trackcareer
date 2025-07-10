
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DSA_TOPICS = [
  'Array',
  'String',
  'Linked List',
  'Stack',
  'Queue',
  'Tree',
  'Binary Tree',
  'Binary Search Tree',
  'Heap',
  'Hash Table',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Sorting',
  'Searching',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'DFS',
  'BFS',
  'Recursion',
  'Math',
  'Bit Manipulation',
  'Trie',
  'Union Find',
  'Segment Tree',
  'Fenwick Tree',
  'Monotonic Stack',
  'Design',
  'Simulation',
  'Game Theory',
  'Geometry',
  'Number Theory',
  'Combinatorics',
  'Probability'
];

interface DSATopicSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DSATopicSelect: React.FC<DSATopicSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select topic",
  className
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {DSA_TOPICS.map((topic) => (
          <SelectItem key={topic} value={topic}>
            {topic}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { DSA_TOPICS };
