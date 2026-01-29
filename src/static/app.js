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
      // Reset activity select to default option to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;

        // Replace existing card markup with participant section
        activityCard.innerHTML = `
          <h4 class="activity-title">${name}</h4>
          <p class="activity-description">${details.description}</p>
          <p class="activity-schedule"><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5 class="participants-heading">Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list (pretty: avatars + emails)
        const participantsList = activityCard.querySelector(".participants-list");
        if (details.participants && details.participants.length) {
          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            // Create initials from the email/local-part
            const local = participant.split("@")[0] || participant;
            const initials = local.split(/[.\-_]/).map(s => s[0] || "").join("").slice(0,2).toUpperCase();
            avatar.textContent = initials;

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = participant;

            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove";
            removeBtn.title = "Unregister";
            removeBtn.type = "button";
            removeBtn.textContent = "✖";

            removeBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participant)}`,
                  { method: "POST" }
                );
                const result = await response.json();
                if (response.ok) {
                  // Remove participant from DOM
                  li.remove();
                  // If no participant-item remains, show placeholder
                  if (!participantsList.querySelectorAll('.participant-item').length) {
                    const noLi = document.createElement('li');
                    noLi.className = 'no-participants';
                    noLi.textContent = 'No participants yet.';
                    participantsList.appendChild(noLi);
                  }
                  // Update availability text
                  const avail = activityCard.querySelector('.activity-availability');
                  if (avail) {
                    const m = avail.textContent.match(/(\d+) spots left/);
                    if (m) {
                      const num = parseInt(m[1], 10) + 1;
                      avail.innerHTML = `<strong>Availability:</strong> ${num} spots left`;
                    }
                  }
                } else {
                  console.error('Unregister failed', result);
                  alert(result.detail || 'Failed to unregister participant');
                }
              } catch (error) {
                console.error('Error unregistering:', error);
                alert('Failed to unregister participant.');
              }
            });

            li.appendChild(avatar);
            li.appendChild(emailSpan);
            li.appendChild(removeBtn);
            participantsList.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet.";
          participantsList.appendChild(li);
        }

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
        // Refresh the activities to show the new participant and updated availability
        await fetchActivities();
        signupForm.reset();
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
