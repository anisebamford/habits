import { useState } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const HABITS = "HABITS";

/**
 * Get today's date in ISO-8601's date format.
 */
const today = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return [y, m, d].join("-");
}

/**
 * Calculate the length of consecutive successes.
 */
const spree = (storage, date) => {
  const sorted = [...storage.dates].sort().reverse().filter((d) => date >= d);
  let lastDate = new Date(sorted.shift());
  let count = 0;
  for (const d of sorted) {
    const date = new Date(d);
    if (lastDate - date === 86400000) {
      count++;
      lastDate = date;
    }
    else {
      break;
    }
  }

  return count;
}

/**
 * Retrieve a storage object.
 */
const getStorage = (type) => {
  return JSON.parse(localStorage.getItem(type))
}

/**
 * Get the list of habits in storage.
 */
const getHabits = () => JSON.parse(localStorage.getItem(HABITS)) || [];

/**
 * Determine the appropriate color for a habit success.
 */
const color = (storage, date) => {
  let h = Math.floor(spree(storage, date) * 12) % 360;
  let l = 52 + Math.floor(spree(storage, date) / 30) * 4 + "%";
  const color = `hsl(${h}, 70%, ${l})`;
  return color;
}

/**
 * Get all successful habit events.
 */
const events = getTypes().reduce(
  (acc, type) => {
    const storage = getStorage(type);
    acc.push(...storage.dates.map(
      (date) => ({
        title: storage.name,
        date,
        color: color(storage, date)
      })
    ))
    return acc;
  }, []
);

/**
 * A habit tracking app that counts streaks of successful days and displays them in a 
 * delightful rainbow.
 */
export default function App() {
  const [_, setNow] = useState(Date.now());
  const rebuild = () => setNow(Date.now());

  /**
   * Create a new habit.
   */
  const addHabit = (type, name) => {
    if (!localStorage.getItem(type)) {
      localStorage.setItem(type, JSON.stringify({name, dates: []}));
      if (!localStorage.getItem(HABITS)) {
        localStorage.setItem(HABITS, "[]");
      }
      const types = JSON.parse(localStorage.getItem(HABITS));
      types.push(type);
      localStorage.setItem(HABITS, JSON.stringify(types));
    }
    rebuild();
  }

  /**
   * Construct a function to execute a habit.
   */
  const getHabitExecutor = (type, storage) => {
    return () => {
      const date = today();
      if (!storage.dates.includes(date)) {
        storage.dates.push(today());
        localStorage.setItem(type, JSON.stringify(storage));
        rebuild();
      }
    }
  }

  /**
   * Callback to add a new habit to the list.
   */ 
  function AddHabit() {
    const [[type, name], setState] = useState(["", ""])
    const setType = (e) => {
      const type = e.target.value.toLowerCase().replace(/\s/g, "-");
      const name = e.target.value;
      setState([type, name])
    }
    return <div>
      <label htmlFor="addHabit">Name</label>
      <input type="text" id="addHabit" onChange={setType}/>
      <input type="button" value="Add Habit" onClick={() => addHabit(type, name)} />
    </div>
  }

  // Construct a list of buttons for each habit.
  const inputs = getTypes().map((type) => {
    const storage = getStorage(type);
    return <input type="button" key={type} value={storage.name} onClick={getHabitExecutor(type, storage)} />
  });

  // Add the AddHabit button.
  inputs.push(<AddHabit key="addHabit"/>);

  // Create the app.
  return (
    <div className="App" style={{display: "flex", flexDirection: "row"}}>
      <div style={{height: "100vh", width: "12vw", display: "flex", flexDirection: "column"}} >
        {inputs}
      </div>
      <div style={{height: "100vh", width: "88vw"}}>
        <FullCalendar
          height={"85%"}
          plugins={[ dayGridPlugin ]}
          initialView="dayGridMonth"
          events={events}
        />
      </div>
    </div>
  );
}
