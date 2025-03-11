import styles from '../CreateGame.module.css';
import DatePicker from 'react-datepicker';

export default function DatePickerComponent({ selectedDate, onChange }: { selectedDate: Date | null; onChange: (date: Date | null) => void }) {
  return (
    <div className={styles.datePickerWrapper}>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => onChange(date)}
        dateFormat="MMMM d, yyyy"
        placeholderText="Select date"
      />
    </div>
  );
}
