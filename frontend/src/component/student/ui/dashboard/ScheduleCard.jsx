import React from 'react';
import { IconClock } from '@tabler/icons-react';
import moment from 'moment';

const ScheduleCard = ({ schedule, eventTypeColors }) => {
  return (
    <div
      className={`p-4 rounded-lg border ${
        eventTypeColors[schedule.eventType]
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold uppercase">
          {schedule.eventType}
        </span>
        <IconClock className="w-4 h-4" />
      </div>
      <h4 className="font-semibold text-sm mb-1">{schedule.title}</h4>
      <p className="text-xs mb-1">
        {schedule.subject?.subjectCode || 'N/A'}
      </p>
      <p className="text-xs">
        {moment(schedule.startDateTime).format('MMM D, h:mm A')}
      </p>
    </div>
  );
};

export default ScheduleCard;
