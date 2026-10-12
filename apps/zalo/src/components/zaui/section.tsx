import type { ReactNode } from 'react';
import type { To } from 'react-router-dom';
import ArrowRightIcon from '../icons/arrow-right';
import TransitionLink from './transition-link';
import { useLang } from '../../lib/i18n';

interface SectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  viewMore?: To;
  isCard?: boolean;
}

/** Khối nội dung kiểu ZaUI: tiêu đề + "Xem tất cả", tuỳ chọn bọc thẻ trắng. */
export default function Section({ children, className = '', title, viewMore, isCard = false }: SectionProps) {
  const { tx } = useLang();
  const header = (title || viewMore) && (
    <div className="flex flex-wrap items-center justify-between gap-1">
      {title && <div className="text-base font-medium text-fg">{title}</div>}
      {viewMore && (
        <TransitionLink to={viewMore} className="flex items-center justify-center gap-1">
          <div className="text-xs text-disabled">{tx({ vi: 'Xem tất cả', en: 'View all' })}</div>
          <ArrowRightIcon className="h-3 w-3" />
        </TransitionLink>
      )}
    </div>
  );
  return (
    <div className={`px-4 ${className}`}>
      {isCard ? (
        <div className="flex flex-col justify-center gap-4 rounded-xl bg-white p-3.5">
          {header}
          {children}
        </div>
      ) : (
        <>
          {header}
          {children}
        </>
      )}
    </div>
  );
}
