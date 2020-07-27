process.env = { TABLE_NAME: 'test' }
import History, {awsConfig, Mapper} from '../src/history';

awsConfig({'endpoint': 'http://localhost:4566', 'region': 'ap-northeast-2'});


describe('history', () => {
  beforeEach(async () => {
    await Mapper.createTable(History, {readCapacityUnits: 5, writeCapacityUnits: 5});
  });
  afterEach(async () => {
    await Mapper.deleteTable(History);
  });
  it('history get or create', async () => {
    let history = await History.getOrCreate('1');
    expect(history).toEqual({
      id: '1'
    });
  });
  it('history update', async () => {
    let history = await History.getOrCreate('1');
    History.update(history, 3600, 0, 3600*1000, '1');
    expect(history).toEqual({
      id: '1',
      postingFrequencyEA: 1,
      lastPostedTimestamp: 3600*1000,
      lastPostedDocumentId: '1'
    });
    History.update(history, 1800, 4800*1000, 7200*1000, '2');
    expect(history).toEqual({
      id: '1',
      postingFrequencyEA: (1800 * 1000) / (3600*1000) * 0.2 + 1 * 0.8,
      lastPostedTimestamp: 7200*1000,
      lastPostedDocumentId: '2'
    });
  });
  it('history update one document', async () => {
    let history = await History.getOrCreate('1');
    History.update(history, 1, 3600*1000, 3600*1000, '1');
    expect(history).toEqual({
      id: '1',
      postingFrequencyEA: 0,
      lastPostedTimestamp: 3600*1000,
      lastPostedDocumentId: '1'
    });
  });
  it('history update zero document', async () => {
    let history = await History.getOrCreate('1');
    History.update(history, 0, 3600*1000, 7200*1000, '1');
    expect(history).toEqual({
      id: '1',
      postingFrequencyEA: 0,
      lastPostedTimestamp: 7200*1000,
      lastPostedDocumentId: '1'
    });
  });
  it('history new save', async () => {
    let history = await History.getOrCreate('1');
    let res = await History.save(history, 2);
    expect(res).toEqual(true);
    expect(history).toEqual({
      id: '1', trackingKey: 2
    });
    let history2 = await History.getOrCreate('1');
    expect(history2).toEqual({
      id: '1', trackingKey: 2
    });
  });
  it('history override not conflict tracking key', async () => {
    let history = await History.getOrCreate('1');
    await History.save(history, 2);
    let history2 = await History.getOrCreate('1');
    History.update(history2, 1, 3600*1000, 3600*1000, '1');
    let res = await History.save(history2, 3);
    expect(res).toEqual(true);
    let history3 = await History.getOrCreate('1');
    expect(history3).toEqual({
      id: '1',
      postingFrequencyEA: 0,
      lastPostedTimestamp: 3600*1000,
      lastPostedDocumentId: '1',
      trackingKey: 3
    });
  });
  it('history override conflict tracking key', async () => {
    let history = await History.getOrCreate('1');
    await History.save(history, 2);
    let history2 = await History.getOrCreate('1');
    History.update(history2, 1, 3600*1000, 3600*1000, '1');
    history2.trackingKey = 3;
    let res = await History.save(history2, 4);
    expect(res).toEqual(false);
    let history3 = await History.getOrCreate('1');
    expect(history3).toEqual({
      id: '1', trackingKey: 2
    });
  })
  it('history initial priority check', async () => {
    let history = await History.getOrCreate('1');
    expect(History.isPriority(history)).toBe(true);
    History.update(history, 1, 3600*1000, 3600*1000, '1');
  });
  it('history priority check', async () => {
    let history = await History.getOrCreate('1');
    History.update(history, 1, 0*1000, 1800*1000, '1');
    expect(History.isPriority(history)).toBe(true);
    let history2 = await History.getOrCreate('2');
    History.update(history2, 1, 0*1000, 4800*1000, '1');
    expect(History.isPriority(history2)).toBe(false);
  });
});