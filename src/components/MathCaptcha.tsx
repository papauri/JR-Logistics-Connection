import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface MathCaptchaProps {
  onValidate: (isValid: boolean) => void;
}

export function MathCaptcha({ onValidate }: MathCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  const generateProblem = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    onValidate(false);
  };

  useEffect(() => {
    generateProblem();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    if (parseInt(val) === num1 + num2) {
      onValidate(true);
    } else {
      onValidate(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-zinc-50 border border-zinc-200">
      <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark">
        Anti-Spam Verification *
      </label>
      <div className="flex items-center gap-3">
        <span className="text-lg font-mono font-bold text-zinc-700 bg-white px-3 py-1 border border-zinc-300">
          {num1} + {num2} = ?
        </span>
        <input
          type="number"
          value={userAnswer}
          onChange={handleChange}
          placeholder="Answer"
          className="w-24 rounded-none border border-zinc-300 py-1.5 px-3 text-sm focus:border-editorial-dark focus:ring-0"
          required
        />
        <button
          type="button"
          onClick={generateProblem}
          className="p-2 text-zinc-500 hover:text-editorial-dark transition-colors"
          title="Refresh problem"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
