import { useState } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const today = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return [y, m, d].join("-");
}

const spree = (storage,date) => {
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

export default function App() {
  const [_, setNow] = useState(Date.now());
  const rebuild = () => setNow(Date.now());
  const getStorage = (type) => {
    return JSON.parse(localStorage.getItem(type))
  }

  const addDoer = (type, name) => {
    if (!localStorage.getItem(type)) {
      localStorage.setItem(type, JSON.stringify({name, dates: []}));
      if (!localStorage.getItem("types")) {
        localStorage.setItem("types", "[]");
      }
      const types = JSON.parse(localStorage.getItem("types"));
      types.push(type);
      localStorage.setItem("types", JSON.stringify(types));
    }
  }

  const getDoer = (type, storage) => {
    return () => {
      const date = today();
      if (!storage.dates.includes(date)) {
        storage.dates.push(today());
        localStorage.setItem(type, JSON.stringify(storage));
        rebuild();
      }
    }
  }

  const getTypes = () => JSON.parse(localStorage.getItem("types")) || [];

  const color = (storage, date) => {
    let h = Math.floor(spree(storage, date) * 12) % 360;
    let l = 52 + Math.floor(spree(storage) / 30) * 4 + "%";
    const color = `hsl(${h}, 70%, ${l})`;
    return color;
  }

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

  const inputs = getTypes().map((type) => {
    const storage = getStorage(type);
    return <input type="button" key={type} value={storage.name} onClick={getDoer(type, storage)} />
  });

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
      <input type="button" value="Add Habit" onClick={() => addDoer(type, name)} />
    </div>
  }
  inputs.push(<AddHabit key="addHabit"/>);

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
