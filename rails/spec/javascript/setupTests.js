import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

jest.mock('react-i18next', () => require('../../__mocks__/react-i18next'));

configure({ adapter: new Adapter() });