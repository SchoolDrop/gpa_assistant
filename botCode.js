import bot from "./bot.js";
import { callDb } from "./callDb.js";
import { dataSaved, histories, historiesCalc } from "./schema.js";

let initialized = false;

export function initBot() {
  if (initialized) return;
  initialized = true;
  const gpaData = {};
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    if (gpaData[chatId]) delete gpaData[chatId];

    bot.sendMessage(
      chatId,
      `
🎓 *GPA Assistant Created By Schooldrop.de* 

Track your GPA. Plan your future.

What do you want to do?
  `,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📊 Calculate GPA", callback_data: "gpa" }],
            [{ text: "📈 Calculate CGPA", callback_data: "cgpa" }],
            [{ text: "🎯 Plan Target GPA", callback_data: "plan_gpa" }],
            // [{ text: "🎯 View Past GPA", callback_data: "past" }],
          ],
        },
      },
    );
  });

  bot.on("callback_query", async (query) => {
    const data = query.data;
    const messageId = query.message.chat.id;
    let user = gpaData[messageId];

    try {
      await callDb();
      switch (data) {
        case "gpa":
          gpaData[messageId] = {
            step: "gpa_clicked",
            totalCreditUnit: 0,
            userTotalPoints: 0,
            value: 0,
            type: "gpa",
            user: "",
            total: 0,
            totalLabel: "course",
            current: 0,
            courses: [],
            created_at: new Date(),
          };

          bot.sendMessage(
            messageId,
            "🎓 *GPA Calculator*\n\nSelect an option:",
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "⚡ Short", callback_data: "method1_calc_gpa" },
                    { text: "📘 Long", callback_data: "method2_calc_gpa" },
                    { text: "⚡ In Depth", callback_data: "method3_calc_gpa" },
                  ],
                  [{ text: "📊 Records", callback_data: "view_calc_gpa" }],
                ],
              },
            },
          );

          break;
        case "cgpa":
          gpaData[messageId] = {
            step: "cgpa_clicked",
            total: 0,
            totalLabel: "semester",
            currentSemester: 0,
            semesters: [],
            value: 0,
            type: "cgpa",
            user: "",
            created_at: new Date(),
          };

          bot.sendMessage(
            messageId,
            "🎓 *CGPA Calculator*\n\nSelect an option:",
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "New CGPA", callback_data: "new_cgpa" },
                    { text: "📊 Records", callback_data: "view_calc_cgpa" },
                  ],
                ],
              },
            },
          );
          await histories.create({
            user_id: messageId,
            data_use: gpaData[messageId].step,
          });

          break;
        case "plan_gpa":
          gpaData[messageId] = {
            step: "plan_gpa",
            total: 0,
            totalLabel: "course",
            current: 0,
            courses: [],
            value: 0,
            type: "plan_gpa",
            user: "",
            created_at: new Date(),
          };
          await histories.create({
            user_id: messageId,
            data_use: "plan_gpa",
          });
          bot.sendChatAction(messageId, "typing");
          setTimeout(() => {
            bot.sendMessage(
              messageId,
              "Things to note. It calculate base on this format.For a 1 credit unit course, the highest point is 5, for a 2 credit unit course the highest point is 10. For a 3 credit unit course, the highest point is 15 and so on. ",
            );
          }, 1200);
          bot.sendChatAction(messageId, "typing");
          setTimeout(() => {
            bot.sendMessage(
              messageId,
              "To plan your GPA, input the number of courses offering",
            );
          }, 1200);

          break;
        case "method1_calc_gpa":
          user.step = "total_credit_unit";
          bot.sendMessage(
            messageId,
            "Calculate GPA through the total credit unit",
          );

          await histories.create({
            user_id: messageId,
            data_use: "method1_calc_gpa",
          });
          bot.sendChatAction(messageId, "typing");
          setTimeout(() => {
            bot.sendMessage(
              messageId,
              "Write down total unit for the semester",
            );
          }, 1200);
          break;
        case "method2_calc_gpa":
          user.step = "num_semesters";

          await histories.create({
            user_id: messageId,
            data_use: "method2_calc_gpa",
          });
          bot.sendChatAction(messageId, "typing");
          setTimeout(() => {
            bot.sendMessage(
              messageId,
              "To calculate your GPA, input the number of courses",
            );
          }, 1200);
          break;
        case "method3_calc_gpa":
          user.step = "user_method3";

          await histories.create({
            user_id: messageId,
            data_use: "method3_calc_gpa",
          });
          bot.sendChatAction(messageId, "typing");
          setTimeout(() => {
            bot.sendMessage(
              messageId,
              "Type your courses in this format\n maths 2 10, social-studies 3 15, english 1 5\n i.e it goes (course name, unit(e.g 1) , point(e.g 5)\nFor any coure name with a space, include - between, i.e social studies -> social-studies",
            );
            bot.sendChatAction(messageId, "typing");
          }, 500);
          setTimeout(() => {
            bot.sendMessage(
              messageId,
              "To calculate your GPA, input the courses in their names, units and points e.g social-studies 2 10, maths 3 15",
            );
          }, 1200);
          break;
        case "view_calc_gpa":
          const res = await dataSaved.find(
            {
              user_id: messageId,
              data_use: "gpa",
            },
            { data_name: 1, data: 1, _id: 0 },
          );
          if (res.length === 0) {
            bot.sendMessage(messageId, "No record found");
            break;
          }
          let values = "";
          res.forEach((value, index) => {
            values += `${index + 1}: ${value.data_name}-${value.data}\n`;
          });
          bot.sendMessage(
            messageId,
            `📊 GPA History

You have ${res.length} ${res.length === 1 ? "record" : "records"}:

${values}`,
          );

          break;
        case "view_calc_cgpa":
          const cgpaRes = await dataSaved.find(
            {
              user_id: messageId,
              data_use: "cgpa",
            },
            { data_name: 1, data: 1, _id: 0 },
          );
          if (cgpaRes.length === 0) {
            bot.sendMessage(messageId, "No record found");
            break;
          }
          let cgpaValues = "";
          cgpaRes.forEach((value, index) => {
            cgpaValues += `${index + 1}: ${value.data_name}-${value.data}\n`;
          });
          bot.sendMessage(
            messageId,
            `📊 CGPA History

You have ${cgpaRes.length} ${cgpaRes.length === 1 ? "record" : "records"}:

${cgpaValues}`,
          );

          break;
        case "new_cgpa":
          user.step = "num_semesters";
          await histories.create({
            user_id: messageId,
            data_use: "new_cgpa",
          });
          bot.sendChatAction(messageId, "typing");
          setTimeout(() => {
            bot.sendMessage(
              messageId,
              "To calculate your CGPA, input how many semesters done",
            );
          }, 1200);
          break;
        case "save":
          if (!user || !user.value || !user.type)
            throw new Error("No Record Found");

          const newUser = await dataSaved.create({
            user_id: messageId,
            data: user.value,
            data_use: user.type,
          });
          user.step = "awaiting_name";
          user.created_at = newUser.created_at;
          bot.sendMessage(
            messageId,
            "Give a name (e.g first semester 2025/2026)",
          );
          break;
        case "cancel":
          delete gpaData[messageId];
          bot.sendMessage(messageId, "Alright, to continue type /start");
          break;

        default:
          bot.sendMessage(messageId, "This plan input isn't available");

          break;
      }
    } catch (err) {
      bot.sendMessage(messageId, err.message);
    }
  });
  bot.on("message", async (msg) => {
    const id = msg.chat.id;

    if (!gpaData[id]) return;
    try {
      await callDb();
      let unit = 0;
      const user = gpaData[id];
      switch (user.step) {
        case "total_credit_unit":
          unit = parseInt(msg.text);
          if (unit < 1) {
            throw new Error("The semester's total unit can't be less than one");
          }
          user.totalCreditUnit = unit;
          user.step = "user_total_point";
          bot.sendChatAction(id, "typing");
          setTimeout(() => {
            bot.sendMessage(
              id,
              "Nice! Now write your overall points i.e the number of points or grade you got from your courses. For example, in a semester, the total gp point you got was 70",
            );
          }, 1200);

          break;
        case "user_total_point":
          await calculateUserGPA2(id, unit, user, msg);

          break;
        case "num_semesters":
          user.total = parseInt(msg.text);

          if (user.total < 1) {
            throw new Error("Must be at least 1 " + user.totalLabel);
          }

          user.step = user.totalLabel + "_input";

          bot.sendChatAction(id, "typing");

          setTimeout(() => {
            if (user.totalLabel === "semester") {
              bot.sendMessage(
                id,
                `Semester 1: Enter GPA and Units (e.g. 4.5 18)`,
              );
            } else {
              bot.sendMessage(
                id,
                `Course 1: Enter Points and Units (e.g. 10 2)i.e  10 points for 2 credit unit course`,
              );
            }
          }, 1100);

          break;
        case "plan_gpa":
          user.total = parseInt(msg.text);

          if (user.total < 1) {
            throw new Error("Must be at least 1 course");
          }

          user.step = "plan_gpa_course_input";
          bot.sendChatAction(id, "typing");
          setTimeout(() => {
            bot.sendMessage(
              id,
              `Type your detail in this format\n math 2 or social-studies 3\n The course name comes first, then the course unit. it should be sent one after the other\n Any course name with space should be added a - inbetween e.g social studies -> social-studies`,
            );
            bot.sendChatAction(id, "typing");
          }, 500);
          setTimeout(() => {
            bot.sendMessage(
              id,
              `Course 1: Enter Course Name and Credit Units (e.g. math 2)`,
            );
          }, 1200);

          break;
        case "semester_input":
          await calculateSemesterInput(id, user, msg);
          break;
        case "course_input":
          await calculateCourseInput(id, user, msg);
          break;
        case "plan_gpa_course_input":
          await writeCourseInput(id, user, msg);
          break;
        case "calc_plan_gpa":
          const expected_gpa = parseFloat(msg.text); // use parseFloat — GPA is decimal
          const total_points_needed = expected_gpa * user.totalCreditUnit;

          let values = "";

          user.courses.forEach((course) => {
            // Each course's proportional share of total points needed
            const courseShare =
              (course.units / user.totalCreditUnit) * total_points_needed;

            // Required grade point for this course = share ÷ its own units
            const requiredGradePoint = courseShare / course.units;
            // Simplifies to: requiredGradePoint = expected_gpa (same for all courses)
            // But this approach scales correctly if you weight courses differently later

            const rounded = Math.round(requiredGradePoint * 10) / 10;
            values += `For ${course.courseName} (${course.units} units), aim for grade point: ${rounded * course.units}\n`;
          });

          values += `\nTarget GPA: ${expected_gpa}`;

          await historiesCalc.create({
            user_id: id,
            data_use: "plan_gpa",
            data: expected_gpa,
          });

          bot.sendChatAction(id, "typing");
          setTimeout(() => {
            bot.sendMessage(id, `GPA Plan:\n${values}`);
          }, 1200);
          break;
        case "use_method3":
          msg.text.split(",").map(([course_name, unit, point]) => {
            if (!course_name || !unit || !point)
              throw new Error(
                "Invalid format, please check the description above",
              );
            if (
              !parseInt(unit) ||
              parseInt(unit) < 1 ||
              !parseFloat(point) ||
              parseFloat(point) < 1
            )
              throw new Error(
                "Invalid format, please check the description above",
              );

            user.totalCreditUnit += parseInt(unit);
            user.userTotalPoints += parseInt(point);
          });
          await calculateUserGPA(id, user);
          break;
        case "awaiting_name":
          await dataSaved.updateOne(
            { user_id: id, data_use: user.type, created_at: user.created_at },
            { $set: { data_name: msg.text } },
          );
          delete gpaData[msg.chat.id];
          bot.sendChatAction(id, "typing");
          setTimeout(() => {
            bot.sendMessage(id, `Alright, to continue type /start`);
          }, 1200);
          break;
        default:
          break;
      }
    } catch (error) {
      bot.sendMessage(id, error.message);
    }
  });

  async function calculateSemesterInput(id, user, msg) {
    const [gpa, units] = msg.text.split(" ").map(Number);

    if (!gpa || !units) {
      throw new Error("Format: GPA Units (e.g. 4.5 18)");
    }

    user.semesters.push({ gpa, units });

    if (user.semesters.length < user.total) {
      user.currentSemester++;
      bot.sendChatAction(id, "typing");

      setTimeout(() => {
        bot.sendMessage(
          id,
          `Semester ${user.currentSemester + 1}: Enter GPA and  Unit`,
        );
      }, 1200);
    } else {
      await calculateCGPA(id, user);
    }
  }
  async function writeCourseInput(id, user, msg) {
    let [courseName, units] = msg.text.split(" ");

    if (!courseName || !units) {
      throw new Error("Format: Course Name Units (e.g. math 2)");
    }
    units = parseInt(units);
    if (!units || units < 1)
      throw new Error("Format: Course Name Units (e.g. math 2)");

    user.courses.push({ courseName, units });

    if (user.courses.length < user.total) {
      user.current++;
      bot.sendChatAction(id, "typing");

      setTimeout(() => {
        bot.sendMessage(
          id,
          `Course ${user.current + 1}: Enter Course Name and  Unit`,
        );
      }, 1200);
    } else {
      user.totalCreditUnit = user.courses
        .map((course) => course.units)
        .reduce((prev, current) => prev + current, 0);
      user.userTotalPoints = user.courses
        .map((course) => course.units)
        .reduce((prev, current) => prev + current * 5, 0);
      bot.sendChatAction(id, "typing");
      setTimeout(() => {
        setTimeout(() => {
          bot.sendMessage(id, `Nice, now enter your planned/desire gpa`);
        }, 2000);
      }, 1200);
      user.step = "calc_plan_gpa";
    }
  }
  async function calculateCourseInput(id, user, msg) {
    const [points, units] = msg.text.split(" ").map(Number);

    if (!points || !units) {
      throw new Error("Format: Points Units (e.g. 4.5 18)");
    }

    user.courses.push({ points, units });

    if (user.courses.length < user.total) {
      user.current++;
      bot.sendChatAction(id, "typing");
      setTimeout(() => {
        setTimeout(() => {
          bot.sendMessage(
            id,
            `Course ${user.current + 1}: Enter Point and Unit`,
          );
        }, 1200);
      }, 1200);
    } else {
      // Sum total units
      user.totalCreditUnit = user.courses.reduce(
        (sum, course) => sum + course.units,
        0,
      );

      // Sum total points
      user.userTotalPoints = user.courses.reduce(
        (sum, course) => sum + course.points,
        0,
      );

      calculateUserGPA(id, user);
    }
  }

  async function calculateUserGPA(id, user) {
    if (user.totalCreditUnit < 1) {
      throw new Error("Total unit can't be less than one");
    }

    const calcValue = (user.userTotalPoints / user.totalCreditUnit).toFixed(2);

    user.value = calcValue;

    await historiesCalc.create({
      user_id: id,
      calc: calcValue,
      data_use: user.type,
    });

    bot.sendChatAction(id, "typing");

    setTimeout(() => {
      bot.sendMessage(
        id,
        `🎉 Beautiful! Your GPA is ${calcValue}.\nDo you wish to save this semester?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Yes", callback_data: "save" }],
              [{ text: "No", callback_data: "cancel" }],
            ],
          },
        },
      );
    }, 1500);
  }
  async function calculateUserGPA2(id, unit, user, msg) {
    unit = parseInt(msg.text);
    if (unit < 1) {
      throw new Error("Total point can't be less than one");
    }

    user.userTotalPoints = unit;
    const calcValue = Number(
      user.userTotalPoints / user.totalCreditUnit,
    ).toFixed(2);
    user.value = calcValue;
    await historiesCalc.create({
      user_id: id,
      calc: calcValue,
      data_use: user.type,
    });

    bot.sendChatAction(id, "typing");

    setTimeout(() => {
      bot.sendMessage(
        id,
        `🎉Beautiful! Your GPA is ${calcValue}.\nDo you wish to save this semester?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Yes", callback_data: "save" }],
              [{ text: "No", callback_data: "cancel" }],
            ],
          },
        },
      );
    }, 1500);
  }
  async function calculateCGPA(id, user) {
    let totalPoints = 0;
    let totalUnits = 0;

    user.semesters.forEach((s) => {
      totalPoints += s.gpa * s.units;
      totalUnits += s.units;
    });

    const cgpa = totalUnits === 0 ? 0 : totalPoints / totalUnits;
    user.value = cgpa;
    await historiesCalc.create({
      user_id: id,
      calc: cgpa,
      data_use: user.type,
    });

    bot.sendMessage(
      id,
      ` 🎓 CGPA Result
    📊 CGPA: ${cgpa.toFixed(2)}
    📚 Total Units: ${totalUnits}
    Do you wish to save this cgpa?
  `,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Yes", callback_data: "save" }],
            [{ text: "No", callback_data: "cancel" }],
          ],
        },
      },
    );
  }
  function predictGPA(id, user) {
    let totalUnits = 0;

    bot.sendMessage(
      id,
      ` 🎓 CGPA Result
    📊 CGPA: ${cgpa.toFixed(2)}
    📚 Total Units: ${totalUnits}
    Do you wish to save this cgpa?
  `,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Yes", callback_data: "save" }],
            [{ text: "No", callback_data: "cancel" }],
          ],
        },
      },
    );
  }
}
