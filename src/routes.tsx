import type { RouteObject } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CapstoneWorkspacePage } from "./features/capstones/CapstoneWorkspacePage";
import { CapstonesPage } from "./features/capstones/CapstonesPage";
import { ConceptMapPage } from "./features/conceptmap/ConceptMapPage";
import { DoctrinePage } from "./features/doctrine/DoctrinePage";
import { ExamPage } from "./features/exam/ExamPage";
import { ExercisesPage } from "./features/exercises/ExercisesPage";
import { HomePage } from "./features/home/HomePage";
import { MistakesPage } from "./features/mistakes/MistakesPage";
import { NotesPage } from "./features/notes/NotesPage";
import { ComingSoon } from "./features/placeholder/ComingSoon";
import { ProgressPage } from "./features/progress/ProgressPage";
import { ReaderPage } from "./features/reader/ReaderPage";
import { ReviewPage } from "./features/srs/ReviewPage";

/**
 * Route table mounted under a single {@link Layout} shell. Reading, the concept
 * map, progress, mistakes, review, exercises, and the mock exam are live; only
 * the catch-all falls through to {@link ComingSoon}.
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "read/:chapterId", element: <ReaderPage /> },
      { path: "map", element: <ConceptMapPage /> },
      { path: "doctrine", element: <DoctrinePage /> },
      { path: "progress", element: <ProgressPage /> },
      { path: "mistakes", element: <MistakesPage /> },
      { path: "review", element: <ReviewPage /> },
      { path: "exercises", element: <ExercisesPage /> },
      { path: "capstones", element: <CapstonesPage /> },
      { path: "capstones/:capstoneId", element: <CapstoneWorkspacePage /> },
      { path: "notes", element: <NotesPage /> },
      { path: "exam", element: <ExamPage /> },
      {
        path: "*",
        element: (
          <ComingSoon
            title="Not found"
            note="That page does not exist. Use the contents to navigate."
          />
        ),
      },
    ],
  },
];
