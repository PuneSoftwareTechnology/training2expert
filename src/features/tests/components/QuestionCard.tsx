import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuestionCardProps {
  questionNumber: number;
  question: string;
  options: string[];
  selectedOption: number | undefined;
  onSelect: (optionIndex: number) => void;
}

export const QuestionCard = memo(function QuestionCard({
  questionNumber,
  question,
  options,
  selectedOption,
  onSelect,
}: QuestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Q{questionNumber}. {question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOption !== undefined ? String(selectedOption) : undefined}
          onValueChange={(val) => onSelect(Number(val))}
        >
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <RadioGroupItem value={String(index)} id={`q${questionNumber}-opt${index}`} />
                <Label
                  htmlFor={`q${questionNumber}-opt${index}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
});
