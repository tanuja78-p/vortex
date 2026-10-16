import React from 'react';
import { MasteryState } from '../types';
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
  state: MasteryState;
  showIcon?: boolean;
  score?: number;
}

export const ConceptMasteryBadge: React.FC<Props> = ({ state, showIcon = true, score }) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'Solid':
        return {
          className: 'badge-mastery badge-solid',
          icon: <CheckCircle2 size={13} />,
          label: 'Solid'
        };
      case 'Needs Practice':
        return {
          className: 'badge-mastery badge-needs-practice',
          icon: <Clock size={13} />,
          label: 'Needs Practice'
        };
      case 'Not Understood':
        return {
          className: 'badge-mastery badge-not-understood',
          icon: <AlertTriangle size={13} />,
          label: 'Not Understood'
        };
      case 'Not Assessed':
      default:
        return {
          className: 'badge-mastery badge-not-assessed',
          icon: <HelpCircle size={13} />,
          label: 'Not Assessed'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={config.className}>
      {showIcon && config.icon}
      <span>{config.label}</span>
      {score !== undefined && state !== 'Not Assessed' && (
        <span style={{ opacity: 0.8, fontSize: '0.72rem', marginLeft: 2 }}>
          ({Math.round(score * 100)}%)
        </span>
      )}
    </span>
  );
};
