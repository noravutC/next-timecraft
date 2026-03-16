import { sortObjArray } from "./sort";

// utils/re-order.ts
export function insertIndexTo<T>(
  dataList: T[],
  config: {
    orderKey: keyof T;
    keyFindIndex: keyof T;
  },
  params: {
    oldValue?: T[keyof T];
    newValue: T[keyof T];
  },
  insertData?: T,
): T[] {
  const sortedList = sortObjArray(dataList, config.orderKey, "asc");

  if (params.oldValue) {
    const oldIndex = sortedList.findIndex(
      (t) => t[config.keyFindIndex] === params.oldValue,
    );
    const newIndex = sortedList.findIndex(
      (t) => t[config.keyFindIndex] === params.newValue,
    );

    if (oldIndex === -1 || newIndex === -1) {
      console.warn("Index not found in insertIndexTo");
      return sortedList;
    }

    const [movedItem] = sortedList.splice(oldIndex, 1);

    if (newIndex !== -1) {
      sortedList.splice(newIndex, 0, movedItem);
    } else {
      sortedList.push(movedItem);
    }
  } else {
    if (!insertData) {
      console.error("insertData is required for insertion mode");
      return sortedList;
    }

    const newIndex = sortedList.findIndex(
      (t) => t[config.keyFindIndex] === params.newValue,
    );
    const safeIndex = newIndex === -1 ? sortedList.length : newIndex;

    sortedList.splice(safeIndex, 0, insertData);
  }

  return sortedList.map((item, index) => ({
    ...item,
    [config.orderKey]: index + 1,
  }));
}
