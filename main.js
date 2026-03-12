const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
  
    function convertToSeconds(time) {
        let [clock, period] = time.trim().split(" ");
        let [h, m, s] = clock.split(":").map(Number);

        if (period.toLowerCase() === "pm" && h !== 12) h += 12;
        if (period.toLowerCase() === "am" && h === 12) h = 0;

        return h * 3600 + m * 60 + s;
    }

    let start = convertToSeconds(startTime);
    let end = convertToSeconds(endTime);

    let diff = end - start;

    let h = Math.floor(diff / 3600);
    let m = Math.floor((diff % 3600) / 60);
    let s = diff % 60;

    return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}


// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
   

    function convert(time){
        let [clock, period] = time.trim().split(" ");
        let [h,m,s] = clock.split(":").map(Number);

        if(period === "pm" && h !== 12) h += 12;
        if(period === "am" && h === 12) h = 0;

        return h*3600 + m*60 + s;
    }

    let start = convert(startTime);
    let end = convert(endTime);

    let startDelivery = 8*3600;
    let endDelivery = 22*3600;

    let idle = 0;

    if(start < startDelivery){
        idle += startDelivery - start;
    }

    if(end > endDelivery){
        idle += end - endDelivery;
    }

    let h = Math.floor(idle/3600);
    let m = Math.floor((idle%3600)/60);
    let s = idle%60;

    return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}


// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {

    function convert(time){
        let [h,m,s] = time.split(":").map(Number);
        return h*3600 + m*60 + s;
    }

    let shift = convert(shiftDuration);
    let idle = convert(idleTime);

    let active = shift - idle;

    let h = Math.floor(active/3600);
    let m = Math.floor((active%3600)/60);
    let s = active%60;

    return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
   

    function convert(time){
        let [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    }

    let active = convert(activeTime);

    let normalQuota = (8 * 3600) + (24 * 60); // 8 hours 24 minutes
    let eidQuota = 6 * 3600; // 6 hours

    let d = new Date(date);
    let eidStart = new Date("2025-04-10");
    let eidEnd = new Date("2025-04-30");

    let quota;

    if(d >= eidStart && d <= eidEnd){
        quota = eidQuota;
    } else {
        quota = normalQuota;
    }

    return active >= quota;
}


// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj){

    let data = fs.readFileSync(textFile,"utf8").trim();
    let lines = data ? data.split("\n") : [];

    for(let line of lines){
        let parts = line.split(",");
        if(parts[0].trim() === shiftObj.driverID && parts[2].trim() === shiftObj.date){
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let quota = metQuota(shiftObj.date, activeTime);

    let newRecord = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quota,
        hasBonus: false
    };

    let newLine = `${shiftObj.driverID},${shiftObj.driverName},${shiftObj.date},${shiftObj.startTime},${shiftObj.endTime},${shiftDuration},${idleTime},${activeTime},${quota},false`;

    lines.push(newLine);
    fs.writeFileSync(textFile, lines.join("\n"));

    return newRecord;
}
    



// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    

    let data = fs.readFileSync(textFile, "utf8").trim();
    let lines = data.split("\n");

    for(let i = 0; i < lines.length; i++){

        let parts = lines[i].split(",");

        if(parts[0] === driverID && parts[2] === date){
            parts[9] = newValue.toString();
            lines[i] = parts.join(",");
        }
    }

    fs.writeFileSync(textFile, lines.join("\n"));
}


// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {

    let data = fs.readFileSync(textFile,"utf8").trim();
    let lines = data.split("\n");

    let count = 0;
    let found = false;

    for(let line of lines){

        let parts = line.split(",");

        if(parts[0].trim() === driverID){

            found = true;

            let date = parts[2].trim();
            let fileMonth = Number(date.split("-")[1]);
            let inputMonth = Number(month);

            if(fileMonth === inputMonth && parts[9].trim() === "true"){
                count++;
            }
        }
    }

    if(!found){
        return -1;
    }

    return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    

    let data = fs.readFileSync(textFile,"utf8").trim();
    let lines = data.split("\n");

    let total = 0;

    for(let line of lines){

        let parts = line.split(",");

        if(parts[0].trim() === driverID){

            let date = parts[2].trim();
            let fileMonth = Number(date.split("-")[1]);

            if(fileMonth === Number(month)){

                let [h,m,s] = parts[7].trim().split(":").map(Number);

                total += h*3600 + m*60 + s;
            }
        }
    }

    let h = Math.floor(total/3600);
    let m = Math.floor((total%3600)/60);
    let s = total%60;

    return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}


// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    

    let data = fs.readFileSync(textFile,"utf8").trim();
    let lines = data.split("\n");

    let rateData = fs.readFileSync(rateFile,"utf8").trim();
    let rateLines = rateData.split("\n");

    let dayOff = "";

    for(let line of rateLines){
        let parts = line.split(",");
        if(parts[0].trim() === driverID){
            dayOff = parts[1].trim();
        }
    }

    let total = 0;

    for(let line of lines){

        let parts = line.split(",");

        if(parts[0].trim() === driverID){

            let date = parts[2].trim();
            let fileMonth = Number(date.split("-")[1]);

            if(fileMonth === Number(month)){

                let d = new Date(date);
                let weekday = d.toLocaleDateString("en-US",{weekday:"long"});

                if(weekday === dayOff){
                    continue;
                }

                let eidStart = new Date("2025-04-10");
                let eidEnd = new Date("2025-04-30");

                let dailyQuota;

                if(d >= eidStart && d <= eidEnd){
                    dailyQuota = 6*3600;
                }else{
                    dailyQuota = 8*3600 + 24*60;
                }

                total += dailyQuota;
            }
        }
    }

    total -= bonusCount * 2 * 3600;

    let h = Math.floor(total/3600);
    let m = Math.floor((total%3600)/60);
    let s = total%60;

    return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}


// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    

    let rateData = fs.readFileSync(rateFile,"utf8").trim();
    let lines = rateData.split("\n");

    let basePay = 0;
    let tier = 0;

    for(let line of lines){
        let parts = line.split(",");
        if(parts[0].trim() === driverID){
            basePay = Number(parts[2]);
            tier = Number(parts[3]);
        }
    }

    function toSeconds(time){
        let [h,m,s] = time.split(":").map(Number);
        return h*3600 + m*60 + s;
    }

    let actual = toSeconds(actualHours);
    let required = toSeconds(requiredHours);

    if(actual >= required){
        return basePay;
    }

    let missing = required - actual;

    let allowance = 0;

    if(tier === 1) allowance = 50*3600;
    if(tier === 2) allowance = 20*3600;
    if(tier === 3) allowance = 10*3600;
    if(tier === 4) allowance = 3*3600;

    missing -= allowance;

    if(missing < 0){
        missing = 0;
    }

    let billableHours = Math.floor(missing / 3600);

    let deductionRate = Math.floor(basePay / 185);

    let salaryDeduction = billableHours * deductionRate;

    return basePay - salaryDeduction;
}


module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
