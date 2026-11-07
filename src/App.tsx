import { useCallback, useEffect, useState } from "react";
import "./styles.css";
import { findCourse } from "./courses";
import { useHashRoute } from "./useHashRoute";
import Home from "./components/Home";
import CoursePage from "./components/CoursePage";
import ChapterPicker from "./components/ChapterPicker";
import Lab from "./components/Lab";

export default function App() {
  const { courseId, unitId } = useHashRoute();
  const course = findCourse(courseId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  // Section anchors like #courses are scroll targets on the home page, not routes.
  useEffect(() => {
    if (courseId && !course && document.getElementById(courseId)) {
      document.getElementById(courseId)!.scrollIntoView({ behavior: "smooth" });
    }
  }, [courseId, course]);

  if (courseId === "lab") return <Lab />;

  return (
    <>
      {course ? (
        <CoursePage course={course} unitId={unitId} onOpenPicker={openPicker} />
      ) : (
        <Home />
      )}
      <ChapterPicker open={pickerOpen} onClose={closePicker} currentCourse={course?.id} currentUnit={unitId} />
    </>
  );
}
