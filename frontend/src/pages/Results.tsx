import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import { Link } from "react-router-dom";

function Results() {
  const candidates = [
    { id: 1, name: "Ahmed Khan", score: 94, status: "Interview" },
    { id: 2, name: "Sarah Ali", score: 91, status: "Interview" },
    { id: 3, name: "John Smith", score: 84, status: "Consider" },
    { id: 4, name: "Emily Davis", score: 61, status: "Reject" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          ATS Analysis Results
        </h1>

        <p className="text-slate-600 dark:text-slate-300">
          Ranked candidates based on ATS score.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Candidates">
          <h2 className="text-3xl font-bold">20</h2>
        </Card>

        <Card title="Interview">
          <h2 className="text-3xl font-bold text-green-600">5</h2>
        </Card>

        <Card title="Consider">
          <h2 className="text-3xl font-bold text-yellow-500">7</h2>
        </Card>

        <Card title="Reject">
          <h2 className="text-3xl font-bold text-red-600">8</h2>
        </Card>
      </div>

      <Card title="Candidate Rankings">
        <div className="overflow-x-auto">
          <table className="min-w-full text-slate-900 dark:text-slate-100">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-700">
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">ATS Score</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <td className="p-3">{index + 1}</td>

                  <td className="p-3">{candidate.name}</td>

                  <td className="p-3 font-semibold">{candidate.score}</td>

                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        candidate.status === "Interview"
                          ? "bg-green-100 text-green-700"
                          : candidate.status === "Consider"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {candidate.status}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <Link to={`/candidate/${candidate.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default Results;