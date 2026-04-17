import TelegramBot from "node-telegram-bot-api";
import { callDb } from "./callDb.js";
import { dataSaved, histories, historiesCalc } from "./schema.js";
import dotenv from "dotenv"

dotenv.config({
  path:".env"
})

const bot = new TelegramBot(process.env.TEL_KEY, {
  polling: true,
});
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
          userCreditUnit: 0,
          value: 0,
          type: "gpa",
          user: "",
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
                  ],
                  [{ text: "📊 Records", callback_data: "view_calc_gpa" }],
                ],
              },
            },
          );

        break;
      case "cgpa":
        gpaData[messageId] = {
          step: "num_semesters",
          totalSemesters: 0,
          currentSemester: 0,
          semesters: [],
          value: 0,
          type: "cgpa",
          user: "",
        };
        await histories.create({
          user_id: messageId,
          data_use: gpaData[messageId].type,
        });
        bot.sendChatAction(messageId, "typing");
        setTimeout(() => {
          bot.sendMessage(
            messageId,
            "To calculate your CGPA, input how many semesters done",
          );
        }, 1200);

        break;
      case "plan_gpa":
        gpaData[messageId] = {
          step: "plan_gpa",
          totalCourses: 0,
          currentCourse: 0,
          courses: [],
          value: 0,
          type: "plan_gpa",
          user: "",
        };
        await histories.create({
          user_id: messageId,
          data_use: "plan_gpa",
        });
        bot.sendChatAction(messageId, "typing");
        setTimeout(() => {
          bot.sendMessage(
            messageId,
            "To plan your GPA, input the total semester's courses",
          );
        }, 1200);

        break;
      case "method1_calc_gpa":
        user.step = "total_credit_unit";
        console.log("yues")
        bot.sendMessage(
          messageId,
          "Calculate GPA through the total credit unit",
        );

        await histories.create({
          user_id: messageId,
          data_use: user.type,
        });
        bot.sendChatAction(messageId, "typing");
        setTimeout(() => {
          bot.sendMessage(
            messageId,
            "Write down total point/gpa gotten for the semester",
          );
        }, 1000);
        break;
      case "view_calc_gpa":
        const res = await dataSaved.find(
          {
            user_id: messageId,
            data_use:"gpa"
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
            data_use:"cgpa"
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
      case "save":
        if(!user ||!user.value || !user.type) throw new Error("No Record Found");
        
        await dataSaved.create({
          user_id: messageId,
          data: user.value,
          data_use: user.type,
        });
        user.step = "awaiting_name";
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
  } catch (err){
    bot.sendMessage(messageId,err.message)
    
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
          throw new Error("Total unit can't be less than one");
        }
        user.totalCreditUnit = unit;
        user.step = "user_credit_unit";
        bot.sendChatAction(id, "typing");
        setTimeout(() => {
          bot.sendMessage(
            id,
            "Nice! Now write the semester's total credit unit",
          );
        }, 1500);

        break;
      case "user_credit_unit":
        await calculateUserGPA(unit, user, msg);

        break;
      case "num_semesters":
        user.totalSemesters = parseInt(msg.text);

        if (user.totalSemesters < 1) {
          throw new Error("Must be at least 1 semester");
        }

        user.step = "semester_input";

        bot.sendChatAction(id, "typing");
        setTimeout(() => {
          bot.sendMessage(id, `Semester 1: Enter GPA and Units (e.g. 4.5 18)`);
        }, 1500);

        break;
      case "plan_gpa":
        user.totalCourses = parseInt(msg.text);

        if (user.totalCourses < 1) {
          throw new Error("Must be at least 1 course");
        }

        user.step = "course_input";
        bot.sendChatAction(id, "typing");
        setTimeout(() => {
          bot.sendMessage(
            id,
            `Semester 1: Enter Course Name and Units (e.g. math 2)`,
          );
        }, 1500);

        break;
      case "semester_input":
        await calculateSemesterInput(id, user,msg);
        break;

      case "course_input":
        const [course_name, course_units] = msg.text.split(" ").map(Number);

        if (!course_name || !course_units) {
          throw new Error("Format:  (e.g. math 2)");
        }

        user.courses.push({ course_name, course_units });

        if (user.courses.length < user.totalCourses) {
          user.currentCourse++;
          bot.sendChatAction(id, "typing");

          setTimeout(() => {
            bot.sendMessage(
              id,
              `Course ${user.currentCourse}: Enter Course Name and Units`,
            );
          }, 1500);
        } else {
          // user.step = "calculate_cgpa";

          predictGPA(id, user, msg);
        }
        break;
      case "awaiting_name":
        await dataSaved.updateOne(
          { user_id: id },
          { $set: { data_name: msg.text } },
        );
        delete gpaData[msg.chat.id];
        bot.sendChatAction(id, "typing");

        setTimeout(() => {
          bot.sendMessage(id, `Alright, to continue type /start`);
        }, 1500);

      default:
        break;
    }
  } catch (error) {
    bot.sendMessage(id, error.message);
  }
});
async function calculateUserGPA(unit, user, msg) {
  unit = parseInt(msg.text);
  if (unit < 1) {
    throw new Error("Total unit can't be less than one");
  }
  if (unit >= user.totalCreditUnit - 1) {
    throw new Error("Total unit can't be equal or more than the semester gpa");
  }
  user.userCreditUnit = unit;
  const calcValue = Number(user.totalCreditUnit / user.userCreditUnit).toFixed(
    2,
  );
  user.value = calcValue;
  await historiesCalc.create({
    user_id: msg.chat.id,
    calc: calcValue,
    data_use: user.type,
  });

  bot.sendChatAction(msg.chat.id, "typing");
  setTimeout(() => {
    bot.sendMessage(
      msg.chat.id,
      `🎉Beautiful! Your GPA is ${calcValue}.
              Do you wish to save this semester?
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
  }, 1500);
}
async function calculateSemesterInput(id, user,msg ) {
  const [gpa, units] = msg.text.split(" ").map(Number);

  if (!gpa || !units) {
    throw new Error("Format: GPA Units (e.g. 4.5 18)");
  }

  user.semesters.push({ gpa, units });

  if (user.semesters.length < user.totalSemesters) {
    user.currentSemester++;
    bot.sendChatAction(id, "typing");

    setTimeout(() => {
      bot.sendMessage(
        id,
        `Semester ${user.currentSemester+1}: Enter GPA and  Unit`,
      );
    }, 1200);
  } else {
    await calculateCGPA(id, user, );
  }
}
async function calculateCGPA(id, user, ) {
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
