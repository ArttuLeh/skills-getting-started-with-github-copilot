document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHtml = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          // Build list items with a delete button next to each participant
          const items = details.participants
              .map((p) => `<li class="participant-item"><span class="email">${p}</span><button class="delete-participant" data-activity="${encodeURIComponent(
                  name
                )}" data-email="${encodeURIComponent(p)}" title="Unregister" aria-label="Unregister ${p}" role="button">✖</button></li>`)
            .join("");
          participantsHtml = `
            <div class="participants">
              <h5>Participants</h5>
              <ul>${items}</ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants">
              <h5>Participants</h5>
              <div class="empty">No participants yet</div>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Delegate click for delete buttons inside activitiesList
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest("button.delete-participant");
    if (!btn) return;

    const activity = decodeURIComponent(btn.getAttribute("data-activity"));
    const email = decodeURIComponent(btn.getAttribute("data-email"));

    // Confirm removal
    const ok = window.confirm(`Unregister ${email} from ${activity}?`);
    if (!ok) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(
        email
      )}`, { method: "DELETE" });

      if (resp.ok) {
        // Refresh the activities list
        fetchActivities();
      } else {
        const body = await resp.json().catch(() => ({}));
        alert(body.detail || "Failed to unregister participant");
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
      alert("Failed to unregister participant. Please try again.");
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to show the newly-registered participant immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
