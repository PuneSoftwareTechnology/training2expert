import { Download, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterActionsProps {
  onReset?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  isFetching?: boolean;
  isExporting?: boolean;
  showReset?: boolean;
  showRefresh?: boolean;
  exportLabel?: string;
}

export function FilterActions({
  onReset,
  onRefresh,
  onExport,
  isFetching = false,
  isExporting = false,
  showReset = true,
  showRefresh = true,
  exportLabel = 'Export Data',
}: FilterActionsProps) {
  return (
    <div className="ml-auto flex items-center gap-2">
      {showReset && onReset && (
        <Button
          size="sm"
          onClick={onReset}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
        </Button>
      )}
      {showRefresh && onRefresh && (
        <Button
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
      {onExport && (
        <Button
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className={`mr-1 h-3.5 w-3.5 ${isExporting ? 'animate-pulse' : ''}`} />
          {exportLabel}
        </Button>
      )}
    </div>
  );
}
