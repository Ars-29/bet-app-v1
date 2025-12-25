import Agenda from "agenda";

const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI || "mongodb://localhost:27017/bet-app",
    collection: "agendaJobs",
  },
  processEvery: '5 seconds', // Check for jobs every 5 seconds
  maxConcurrency: 20,
  defaultConcurrency: 5,
  lockLimit: 0, // No limit on locked jobs
});

export default agenda;
