"use client";

export function SelectAllCheckbox({ name }: { name: string }) {
  return (
    <input
      type="checkbox"
      aria-label="Select all"
      onChange={(e) => {
        const form = e.currentTarget.closest("form");
        form
          ?.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"]`)
          .forEach((cb) => {
            cb.checked = e.currentTarget.checked;
          });
      }}
    />
  );
}
